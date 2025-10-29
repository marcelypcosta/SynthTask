'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MeetingUploadForm from '@/feature/meetings/components/meeting-upload-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProcessedMeeting {
  id: string;
  summary: string;
  key_points: string[];
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    assignee: string | null;
    due_date: string | null;
  }>;
  created_at: string;
  sent_to_trello: boolean;
}

export default function UploadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<ProcessedMeeting | null>(null);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Carregando...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800">Processar Reunião</h1>
        <p className="text-neutral-500 mt-2">Envie um arquivo de texto para processar com IA</p>
      </div>

      <Separator />

      {/* Upload Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeetingUploadForm onSuccess={setResult} />

        {/* Results */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">✅ Reunião Processada!</CardTitle>
              <CardDescription className="text-green-700">
                {new Date(result.created_at).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-2">📝 Resumo</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">{result.summary}</p>
              </div>

              <Separator />

              {/* Key Points */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">🎯 Pontos-Chave</h3>
                <ul className="space-y-2">
                  {result.key_points.map((point, idx) => (
                    <li key={idx} className="flex gap-2 text-neutral-700 text-sm">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Tasks */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">
                  ✓ Tarefas ({result.tasks.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.tasks.map((task) => (
                    <div key={task.id} className="border border-neutral-200 rounded-lg p-3 bg-white text-sm">
                      <h4 className="font-semibold text-neutral-900">{task.title}</h4>
                      <p className="text-neutral-600 text-xs mt-1">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'Alta'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'Média'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                        {task.assignee && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            👤 {task.assignee}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info */}
      {!result && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>✓ Envie um arquivo de texto com a transcrição da reunião</p>
            <p>✓ A IA irá extrair resumo, pontos-chave e tarefas automaticamente</p>
            <p>✓ Formatos suportados: .txt, .md, .pdf (máximo 10MB)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}