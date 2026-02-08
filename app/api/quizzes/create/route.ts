import { NextRequest, NextResponse } from 'next/server'
import { verifyAgentApiKey } from '@/lib/auth/agent-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { createQuizSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
    try {
        // Verify agent API key
        const apiKey = request.headers.get('X-Agent-API-Key')

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key required. Only agents can create quizzes.' },
                { status: 401 }
            )
        }

        const agentAuth = await verifyAgentApiKey(apiKey)

        if (!agentAuth) {
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 403 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = createQuizSchema.parse(body)

        const supabase = createServiceClient()

        // Create quiz in transaction
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .insert({
                title: validatedData.title,
                description: validatedData.description,
                creator_agent_id: agentAuth.agentId,
                tags: validatedData.tags,
                difficulty: validatedData.difficulty,
            })
            .select()
            .single()

        if (quizError) {
            throw new Error(`Failed to create quiz: ${quizError.message}`)
        }

        // Create questions and their options/answers
        for (const questionData of validatedData.questions) {
            const { data: question, error: questionError } = await supabase
                .from('questions')
                .insert({
                    quiz_id: quiz.id,
                    question_text: questionData.questionText,
                    question_type: questionData.questionType,
                    order_index: questionData.orderIndex,
                    points: questionData.points,
                })
                .select()
                .single()

            if (questionError) {
                throw new Error(`Failed to create question: ${questionError.message}`)
            }

            // Handle multiple choice options
            if (questionData.questionType === 'multiple_choice' && questionData.options) {
                const optionsToInsert = questionData.options.map(opt => ({
                    question_id: question.id,
                    option_text: opt.optionText,
                    is_correct: opt.isCorrect,
                    order_index: opt.orderIndex,
                }))

                const { error: optionsError } = await supabase
                    .from('question_options')
                    .insert(optionsToInsert)

                if (optionsError) {
                    throw new Error(`Failed to create options: ${optionsError.message}`)
                }
            }

            // Handle text answers
            if (questionData.questionType === 'text_answer' && questionData.acceptableAnswers) {
                const answersToInsert = questionData.acceptableAnswers.map(ans => ({
                    question_id: question.id,
                    answer_text: ans.answerText,
                    case_sensitive: ans.caseSensitive,
                }))

                const { error: answersError } = await supabase
                    .from('text_answers')
                    .insert(answersToInsert)

                if (answersError) {
                    throw new Error(`Failed to create text answers: ${answersError.message}`)
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                quizId: quiz.id,
                title: quiz.title,
                questionCount: validatedData.questions.length,
            },
            message: 'Quiz created successfully!',
        })
    } catch (error: any) {
        console.error('Error creating quiz:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create quiz' },
            { status: 500 }
        )
    }
}
