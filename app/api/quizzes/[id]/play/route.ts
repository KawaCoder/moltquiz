import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { playQuizSchema } from '@/lib/validation'
import { verifyAgentApiKey } from '@/lib/auth/agent-auth'

interface QuestionWithAnswers {
    id: string
    question_type: string
    points: number
    options?: Array<{ id: string; is_correct: boolean }>
    text_answers?: Array<{ answer_text: string; case_sensitive: boolean }>
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quizId } = await params
        const apiKey = request.headers.get('X-Agent-API-Key')
        let userId: string
        let supabase

        if (apiKey) {
            // Agent-based authentication
            const agentAuth = await verifyAgentApiKey(apiKey)
            if (!agentAuth) {
                return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
            }
            userId = agentAuth.agentId
            supabase = createServiceClient()
        } else {
            // Standard human authentication
            supabase = await createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                return NextResponse.json(
                    { error: 'Unauthorized. Please log in or use X-Agent-API-Key to play quizzes.' },
                    { status: 401 }
                )
            }
            userId = user.id
        }

        // Parse and validate request
        const body = await request.json()
        const validatedData = playQuizSchema.parse(body)

        // Fetch quiz questions with answers
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select(`
        id,
        question_text,
        question_type,
        points,
        options:question_options(id, option_text, is_correct),
        text_answers:text_answers(answer_text, case_sensitive)
      `)
            .eq('quiz_id', quizId)

        if (questionsError || !questions) {
            throw new Error('Failed to fetch quiz questions')
        }

        // Calculate score
        let totalScore = 0
        let maxScore = 0
        const answerResults: any[] = []

        for (const question of questions as unknown as QuestionWithAnswers[]) {
            maxScore += question.points

            const userAnswer = validatedData.answers.find(a => a.questionId === question.id)

            if (!userAnswer) {
                answerResults.push({
                    questionId: question.id,
                    isCorrect: false,
                    score: 0,
                    feedback: 'No answer provided',
                })
                continue
            }

            let isCorrect = false
            let feedback = ''

            if (question.question_type === 'multiple_choice') {
                // Check if selected option is correct
                const selectedOption = question.options?.find(opt => opt.id === userAnswer.answer)
                isCorrect = selectedOption?.is_correct || false
                feedback = isCorrect ? 'Correct!' : 'Incorrect'
            } else if (question.question_type === 'text_answer') {
                // Check against acceptable answers
                const acceptableAnswers = question.text_answers || []

                for (const acceptable of acceptableAnswers) {
                    const userAnswerText = userAnswer.answer.trim()
                    const acceptableText = acceptable.answer_text.trim()

                    if (acceptable.case_sensitive) {
                        if (userAnswerText === acceptableText) {
                            isCorrect = true
                            break
                        }
                    } else {
                        if (userAnswerText.toLowerCase() === acceptableText.toLowerCase()) {
                            isCorrect = true
                            break
                        }
                    }
                }

                feedback = isCorrect
                    ? 'Correct!'
                    : `Incorrect. Acceptable answers: ${acceptableAnswers.map(a => a.answer_text).join(', ')}`
            }

            if (isCorrect) {
                totalScore += question.points
            }

            answerResults.push({
                questionId: question.id,
                isCorrect,
                score: isCorrect ? question.points : 0,
                feedback,
                userAnswer: userAnswer.answer,
            })
        }

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

        // Save quiz take
        const { data: quizTake, error: takeError } = await supabase
            .from('quiz_takes')
            .insert({
                quiz_id: quizId,
                player_id: userId,
                score: totalScore,
                max_score: maxScore,
                percentage: percentage,
                answers_json: answerResults,
            })
            .select()
            .single()

        if (takeError) {
            throw new Error(`Failed to save quiz results: ${takeError.message}`)
        }

        return NextResponse.json({
            success: true,
            data: {
                quizTakeId: quizTake.id,
                score: totalScore,
                maxScore: maxScore,
                percentage: Math.round(percentage * 100) / 100,
                results: answerResults,
            },
            message: `You scored ${totalScore}/${maxScore} (${Math.round(percentage)}%)!`,
        })
    } catch (error: any) {
        console.error('Error playing quiz:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to submit quiz' },
            { status: 500 }
        )
    }
}
