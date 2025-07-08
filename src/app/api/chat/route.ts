import { OpenAI } from "openai/client.js";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});  // here we are initializing the openai client


export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json(); // here we are taking the data from the client


        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            stream: true,
        });   // here we are initializing the openai stream and sending the messages to the openai and starting the stream

        const encoder = new TextEncoder(); // creating the instance of the text encoder

        const readable = new ReadableStream({
            async start(controller) {
                try {

                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta.content || "";
                        if (content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                            console.log("content", content);
                        }
                    }

                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    controller.close();
                } catch (error) {
                    console.error("Error in the stream", error);
                    controller.error(error);
                }
            }

        }) // here we are creating the readable stream


        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        })


    } catch (error) {
        console.error("Error in the stream", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

}