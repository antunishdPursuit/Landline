import "server-only";

export interface RagSource {
  title: string;
  document_id: string;
  excerpt: string;
}

export interface RagAnswer {
  answered: boolean;
  answer: string | null;
  sources: RagSource[];
  query_used?: string | null;
  reason?: string | null;
}

export async function getRagAnswer(question: string): Promise<RagAnswer> {
  const serviceUrl = process.env.RAG_SERVICE_URL;
  const apiKey = process.env.RAG_SERVICE_API_KEY;

  if (!serviceUrl) {
    throw new Error("Missing environment variable: RAG_SERVICE_URL");
  }
  if (!apiKey) {
    throw new Error("Missing environment variable: RAG_SERVICE_API_KEY");
  }

  const response = await fetch(`${serviceUrl}/rag/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": apiKey,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`RAG service responded with status ${response.status}`);
  }

  return response.json() as Promise<RagAnswer>;
}
