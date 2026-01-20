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
  "id": "string",          // Identificador único (obrigatório)
  "name": "string",        // Nome exibido no gráfico
  "value": 10,             // Valor numérico (Heurística h ou Utilidade)
  "costToParent": 1,       // Custo da aresta para chegar neste nó (g)
  "isGoal": false,         // Define se este nó é um estado de objetivo
  "boardState": [...],     // Estado específico do jogo (opcional)
  "children": []           // Lista de nós filhos (recursivo)
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
                        <h2 className="text-2xl font-bold">Propriedades Avançadas e de Simulação</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Estas propriedades são geralmente injetadas automaticamente pelos algoritmos durante a simulação, mas podem ser definidas manualmente para fins de visualização estática ou depuração.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Network size={16} className="text-orange-500" />
                                <h4 className="font-bold text-sm">Alpha-Beta Pruning</h4>
                            </div>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                <li><code className="text-primary">alpha</code>: Melhor valor para MAX encontrado até agora.</li>
                                <li><code className="text-primary">beta</code>: Melhor valor para MIN encontrado até agora.</li>
                                <li><code className="text-primary">isPruned</code>: (bool) Se o nó foi podado.</li>
                                <li><code className="text-primary">pruningTriggeredBy</code>: (string) ID do nó que causou o corte.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl border bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye size={16} className="text-blue-500" />
                                <h4 className="font-bold text-sm">Estado Visual</h4>
                            </div>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                <li><code className="text-primary">isVisited</code>: (bool) Se o algoritmo visitou este nó.</li>
                                <li><code className="text-primary">isCurrent</code>: (bool) Se é o nó ativo na iteração atual.</li>
                                <li><code className="text-primary">isCutoffPoint</code>: (bool) Se a busca parou aqui (profundidade).</li>
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
                                O <code className="text-primary">boardState</code> deve ser um array de 9 números contendo de 0 a 8. O 0 representa o espaço vazio.
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
                                O <code className="text-primary">boardState</code> deve ser um array de 9 strings contendo "X", "O" ou null.
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
