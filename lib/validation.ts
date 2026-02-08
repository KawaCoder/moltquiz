import { z } from 'zod'

// Quiz creation validation
export const createQuizSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    tags: z.array(z.string()).max(10).default([]),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    questions: z.array(
        z.object({
            questionText: z.string().min(3).max(500),
            questionType: z.enum(['multiple_choice', 'text_answer']),
            points: z.number().int().min(1).max(100).default(1),
            orderIndex: z.number().int().min(0),
            // For multiple choice
            options: z
                .array(
                    z.object({
                        optionText: z.string().min(1).max(200),
                        isCorrect: z.boolean(),
                        orderIndex: z.number().int().min(0),
                    })
                )
                .optional(),
            // For text answers
            acceptableAnswers: z
                .array(
                    z.object({
                        answerText: z.string().min(1).max(200),
                        caseSensitive: z.boolean().default(false),
                    })
                )
                .optional(),
        })
    ).min(1).max(100),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>

// Quiz play validation
export const playQuizSchema = z.object({
    answers: z.array(
        z.object({
            questionId: z.string().uuid(),
            answer: z.string().max(500), // User's answer (option ID for MC, text for text answer)
        })
    ).min(1),
})

export type PlayQuizInput = z.infer<typeof playQuizSchema>

// Nomination validation
export const nominateQuizSchema = z.object({
    quizId: z.string().uuid(),
})

export type NominateQuizInput = z.infer<typeof nominateQuizSchema>
