import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Feedback } from '../../components/ui/feedback';
import { createQuoteRequest } from '../../lib/quotes';
import { registerUser } from '../../lib/auth';
import type { IMaquina as Machine } from '../../types/machine.types';
import type { InitialQuoteData } from './initial-quote-modal';
import type { UserProfile } from '../../types/auth';

interface UserInfoModalProps {
  machine: Machine;
  quoteData: InitialQuoteData;
  onClose: () => void;
  onSubmit: () => void;
}

export function UserInfoModal({ machine, quoteData, onClose, onSubmit }: UserInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!machine.id) {
        throw new Error('ID da máquina não encontrado');
      }

      if (!machine.proprietarioId) {
        throw new Error('ID do proprietário não encontrado');
      }

      // Criar usuário temporário
      const tempPassword = Math.random().toString(36).slice(-8);
      const userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'> = {
        type: 'individual',
        email: formData.email,
        fullName: formData.fullName,
        cpfCnpj: '',
        phone: formData.phone,
      };

      const userProfile = await registerUser(formData.email, tempPassword, userData);

      // Criar solicitação de orçamento
      await createQuoteRequest({
        machineId: machine.id,
        ownerId: machine.proprietarioId,
        renterId: userProfile.uid,
        startDate: quoteData.startDate,
        endDate: quoteData.endDate,
        purpose: quoteData.purpose,
        location: quoteData.location,
        status: 'pending',
      });

      onSubmit();
    } catch (err: any) {
      console.error('Erro ao criar usuário e orçamento:', err);
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-xl font-semibold">Seus Dados de Contato</h2>

        {error && (
          <Feedback
            type="error"
            message={error}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none"
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Telefone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border p-2 focus:border-blue-500 focus:outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={loading}
            >
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
