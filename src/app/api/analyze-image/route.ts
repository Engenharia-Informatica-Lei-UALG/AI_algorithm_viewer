import { NextRequest, NextResponse } from 'next/server';

// Helper para converter stream em buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "sua_chave_aqui") {
        return NextResponse.json({ error: 'API Key do Gemini não configurada no servidor.' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
        }

        // Converter a imagem para Base64
        const imageBuffer = await streamToBuffer(file.stream());
        const base64Image = imageBuffer.toString('base64');
        const mimeType = file.type;

        const prompt = `
          Analise esta imagem. Identifique se é um jogo da velha (TicTacToe) ou um 8-Puzzle.
          Retorne APENAS um JSON válido (sem markdown) com a seguinte estrutura:
          
          Se TicTacToe: { "type": "tictactoe", "board": ["X", null, "O", ...] } (array de tamanho 9, null para vazio)
          Se 8-Puzzle: { "type": "8puzzle", "board": [1, 2, 3, 8, 0, 4, 7, 6, 5] } (0 representa o espaço vazio)
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Erro da API Gemini:", errorBody);
            return NextResponse.json({ error: `Erro na API do Gemini: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return NextResponse.json({ error: "Resposta inválida do modelo de IA." }, { status: 500 });
        }

        const jsonString = textResponse.replace(/```json|```/g, '').trim();
        const parsedResult = JSON.parse(jsonString);

        return NextResponse.json(parsedResult);

    } catch (error) {
        console.error("Erro interno no proxy de análise de imagem:", error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
