"use client"

import Link from "next/link"
import { ArrowLeft, Code2, FileJson, Parentheses, TreePine, Gamepad2, Puzzle } from "lucide-react"

export default function JsonDocsPage() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12 font-sans max-w-4xl mx-auto">
            <header className="mb-12">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 font-bold"
                >
                    <ArrowLeft size={20} />
                    Voltar para o Laboratório
                </Link>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary mb-4 flex items-center gap-4">
                    <FileJson size={48} />
                    Documentação JSON
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Compreenda a estrutura de dados que alimenta a visualização e os algoritmos do Algorithm AI Labs.
                </p>
            </header>

            <main className="space-y-12">
                {/* Core Node Structure */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                        <TreePine className="text-primary" />
                        <h2 className="text-2xl font-bold">Estrutura do Nó (CustomTreeNode)</h2>
                    </div>
                    <p className="text-muted-foreground">
                        A árvore é composta por nós recursivos. Cada nó possui propriedades que definem tanto o comportamento do algoritmo quanto a visualização.
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
                            Identificadores e Nomes
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            O <code className="text-primary">id</code> deve ser único em toda a árvore para evitar bugs de renderização.
                            O <code className="text-primary">name</code> é usado apenas para exibição e busca.
                        </p>
                    </div>
                    <div className="p-6 rounded-xl border bg-card/50">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Parentheses size={18} className="text-primary" />
                            Valores e Heurísticas
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            O campo <code className="text-primary">value</code> é vital para algoritmos como **A*** (heurística h(n))
                            e **Minimax** (valor de utilidade/score).
                        </p>
                    </div>
                </section>

                {/* Problem Specifics */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-2">
                        <Gamepad2 className="text-primary" />
                        <h2 className="text-2xl font-bold">Especificidades por Problema</h2>
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
                    <h2 className="text-xl font-bold mb-4">Dica de Produtividade</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Você pode copiar o JSON diretamente da aba <strong>JSON</strong> no editor do projeto, modificá-lo e colá-lo
                        novamente para criar estruturas complexas rapidamente. A validação é feita automaticamente
                        ao carregar o JSON.
                    </p>
                </section>
            </main>

            <footer className="mt-20 pt-8 border-t text-center text-muted-foreground text-sm pb-12">
                Brandon Mejia — Desenvolvido com foco em educação e IA.
            </footer>
        </div>
    )
}
