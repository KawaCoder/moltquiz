'use client'

import { useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

export default function NoticePage() {
    const [lang, setLang] = useState<'fr' | 'en'>('fr')

    const content: Record<'fr' | 'en', {
        title: string;
        text1: ReactNode;
        footerTitle: string;
        footerText: ReactNode;
        return: string;
    }> = {
        fr: {
            title: "Openclaw est un nid à vulnérabilités !",
            text1: <>
                OpenClaw est un outil en pleine explosion, et en quelques semaines, le nombre d'outils et d'utilisateurs explose.
                Cependant il est vital de mentionner que cette importante expansion ne laisse pas la place aux questionnements de sécurité concernant l'utilisation
                d'agents sur son ordinateur. En effet, comme mentionné sur <a href="https://www.moltbook.com/post/cbd6474f-8478-4894-95f1-7b104a73bcd5" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 underline-offset-4 font-bold transition-all">ce post</a>,
                le fonctionnement des agents est de télécharger des skills depuis internet, et de les exécuter sans aucun process de vérification.
                Ces skills peuvent contenir des prompts qui poussent l'agent à voler des données, ouvrir des reverse shell, etc... Il n'y a actuellement aucune protection
                officielle contre cela. Il faut alors être extrêmement vigilants face aux skills que l'on télécharge, car ceux-là exécutent du code arbitraire sur notre machine
                sans vérification, et sans même une revue par l'humain. Pour moi, OpenClaw représente un réel danger pour tout des utilisateurs.
            </>,
            footerTitle: "Moltquiz?",
            footerText: <>
                Moltquiz a été créé par <a href="http://github.com/KawaCoder" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 underline-offset-4 font-bold transition-all">KawaCoder</a>. Ce projet est en cours d'analyse de sécurité, et il est conseillé de ne pas transmettre d'informations personnelles, ni de données sensibles. Soyez libres de contribuer sur github et de faire des retours !
            </>,
            return: "Return to the main page"
        },
        en: {
            title: "OpenClaw is a nest of vulnerabilities!",
            text1: <>
                OpenClaw is an exploding tool, and within a few weeks, the number of tools and users is sky-rocketing.
                However, it is vital to mention that this significant expansion leaves no room for security questions regarding the use
                of agents on one's computer. Indeed, as mentioned in <a href="https://www.moltbook.com/post/cbd6474f-8478-4894-95f1-7b104a73bcd5" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 underline-offset-4 font-bold transition-all">this post</a>,
                agents work by downloading skills from the internet and executing them without any verification process.
                These skills can contain prompts that push the agent to steal data, open reverse shells, etc... There is currently no official protection
                against this. We must therefore be extremely vigilant regarding the skills we download, as they execute arbitrary code on our machine
                without verification, and without even a human review. For me, OpenClaw represents a real danger to all users.
            </>,
            footerTitle: "Moltquiz?",
            footerText: <>
                Moltquiz was created by <a href="http://github.com/KawaCoder" className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 underline-offset-4 font-bold transition-all">KawaCoder</a>. This project is currently undergoing security analysis, and it is advised not to transmit personal information or sensitive data. Feel free to contribute on github and give feedback!
            </>,
            return: "Return to the main page"
        }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/10 relative font-sans antialiased overflow-x-hidden">
            {/* High-Visibility Lobster Pattern Background */}
            <div
                className="fixed inset-0 bg-lobster-grid pointer-events-none z-0"
                style={{ opacity: 0.8 }}
            />

            {/* Subtle overlay */}
            <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-1" />

            <div className="container relative mx-auto px-4 py-24 z-10 flex flex-col items-center justify-center min-h-screen">
                <Card className="bg-neutral-950/80 backdrop-blur-2xl border-white/10 max-w-3xl w-full animate-in fade-in zoom-in-95 duration-700 shadow-2xl">
                    <CardHeader className="border-b border-white/5 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Shield className="w-8 h-8 text-white/40" />
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-widest text-white">Important Notice</CardTitle>
                                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mt-1">MoltQuiz & OpenClaw Ecosystem</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLang('fr')}
                                    className={`text-xl p-2 h-auto hover:bg-white/5 ${lang === 'fr' ? 'bg-white/10 opacity-100 ring-1 ring-white/20' : 'opacity-40'}`}
                                >
                                    🇫🇷
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLang('en')}
                                    className={`text-xl p-2 h-auto hover:bg-white/5 ${lang === 'en' ? 'bg-white/10 opacity-100 ring-1 ring-white/20' : 'opacity-40'}`}
                                >
                                    🇺🇸
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="py-12 px-12 space-y-8">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-blue-600 pl-6">
                                {content[lang].title}
                            </h2>
                            <p className="text-white/80 text-lg md:text-xl leading-relaxed font-medium">
                                {content[lang].text1}
                            </p>

                            <div className="h-px bg-white/10 my-16" />

                            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-blue-600 pl-6">
                                {content[lang].footerTitle}
                            </h2>
                            <p className="text-white/80 text-lg md:text-xl leading-relaxed italic font-medium">
                                {content[lang].footerText}
                            </p>
                        </div>

                        <div className="pt-12 flex justify-center">
                            <Link href="/">
                                <Button variant="ghost" className="text-white/40 hover:text-white flex items-center gap-3 px-8 group transition-all">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-xs uppercase tracking-[0.3em] font-black">{content[lang].return}</span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="fixed bottom-10 left-0 right-0 z-10 text-center">
                <p className="text-[10px] uppercase font-black tracking-[1.2em] text-white/5 font-sans mb-6 pointer-events-none">Security Documentation // OpenClaw</p>
                <div className="flex flex-col items-center gap-2 transition-opacity duration-500">
                    <p className="text-sm text-white font-medium tracking-wide">
                        Fais avec <span className="text-red-500 mx-1">❤️</span> par <a href="https://github.com/KawaCoder" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-all font-black underline decoration-blue-500/30 underline-offset-4">KawaCoder</a> 🇫🇷
                    </p>
                    <a href="mailto:kawacoder@duck.com" className="text-xs text-white/50 hover:text-white transition-colors tracking-widest font-mono">
                        kawacoder@duck.com
                    </a>
                </div>
            </div>

            {/* Discreet French Flag Line - Only visible at bottom of scroll */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] flex z-50">
                <div className="flex-1 bg-blue-600" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-red-600" />
            </div>
        </div>
    )
}
