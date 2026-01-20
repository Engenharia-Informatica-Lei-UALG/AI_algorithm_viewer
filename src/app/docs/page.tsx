"use client"

import Link from "next/link"
import { ArrowLeft, Code2, FileJson, Parentheses, TreePine, Gamepad2, Puzzle, Network, BrainCircuit, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function JsonDocsPage() {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen bg-background p-6 md:p-12 font-sans max-w-4xl mx-auto">
            <header className="mb-12">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-bold"
                >
                    <ArrowLeft size={20} />
                    {t('docs.back')}
                </Link>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary mb-4 flex items-center gap-4">
                    <FileJson size={48} />
                    {t('docs.title')}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    {t('docs.intro')}
                </p>
            </header>

            <main className="space-y-12">
                {/* Core Node Structure */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                        <TreePine className="text-primary" />
                        <h2 className="text-2xl font-bold">{t('docs.node_struct_title')}</h2>
                    </div>
                    <p className="text-muted-foreground">
                        {t('docs.node_struct_desc')}
                    </p>

                    <div className="bg-muted p-6 rounded-xl font-mono text-sm overflow-x-auto border">
                        <pre>{`{
  "id": "string",          // ${t('docs.comment_id')}
  "name": "string",        // ${t('docs.comment_name')}
  "value": 10,             // ${t('docs.comment_value')}
  "costToParent": 1,       // ${t('docs.comment_cost')}
  "isGoal": false,         // ${t('docs.comment_isgoal')}
  "boardState": [...],     // ${t('docs.comment_boardstate')}
  "children": []           // ${t('docs.comment_children')}
}`}</pre>
                    </div>
                </section>

                {/* Property Details */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border bg-card/50">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Code2 size={18} className="text-primary" />
                            {t('docs.identifiers_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('docs.identifiers_desc')}
                        </p>
                    </div>
                    <div className="p-6 rounded-xl border bg-card/50">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Parentheses size={18} className="text-primary" />
                            {t('docs.values_title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('docs.values_desc')}
                        </p>
                    </div>
                </section>

                {/* Advanced Properties */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                        <BrainCircuit className="text-primary" />
                        <h2 className="text-2xl font-bold">{t('docs.advanced_props_title')}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('docs.advanced_props_desc')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Network size={16} className="text-orange-500" />
                                <h4 className="font-bold text-sm">{t('docs.alphabeta_title')}</h4>
                            </div>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                <li><code className="text-primary">alpha</code>: {t('docs.alphabeta_alpha')}</li>
                                <li><code className="text-primary">beta</code>: {t('docs.alphabeta_beta')}</li>
                                <li><code className="text-primary">isPruned</code>: {t('docs.alphabeta_ispruned')}</li>
                                <li><code className="text-primary">pruningTriggeredBy</code>: {t('docs.alphabeta_trigger')}</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye size={16} className="text-blue-500" />
                                <h4 className="font-bold text-sm">{t('docs.visual_state_title')}</h4>
                            </div>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                <li><code className="text-primary">isVisited</code>: {t('docs.visual_isvisited')}</li>
                                <li><code className="text-primary">isCurrent</code>: {t('docs.visual_iscurrent')}</li>
                                <li><code className="text-primary">isCutoffPoint</code>: {t('docs.visual_iscutoff')}</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Problem Specifics */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                        <Gamepad2 className="text-primary" />
                        <h2 className="text-2xl font-bold">{t('docs.problem_specifics')}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Puzzle size={18} className="text-primary" />
                                <h4 className="font-bold">8-Puzzle</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('docs.puzzle8_desc')}
                            </p>
                            <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                                "boardState": [1, 2, 3, 4, 8, 0, 7, 6, 5]
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Gamepad2 size={18} className="text-primary" />
                                <h4 className="font-bold">Tic-Tac-Toe</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('docs.tictactoe_desc')}
                            </p>
                            <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                                "boardState": ["X", "O", null, "X", null, null, "O", null, null]
                            </div>
                        </div>
                    </div>
                </section>

                {/* Export/Import Tips */}
                <section className="p-8 rounded-2xl bg-primary/5 border-2 border-primary/20">
                    <h2 className="text-xl font-bold mb-4">{t('docs.productivity_tip')}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {t('docs.productivity_desc')}
                    </p>
                </section>
            </main>

            <footer className="mt-20 pt-8 border-t text-center text-muted-foreground text-sm pb-12">
                {t('docs.footer')}
            </footer>
        </div>
    )
}
