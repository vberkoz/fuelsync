import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface FormData {
  category: string;
  amount: string;
  currency: string;
  odometer: string;
  description: string;
  odometerImageKey?: string;
}

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  odometer?: number;
  description?: string;
}

export function useExpenseForm(vehicleId: string | null, onSuccess?: (variables: any) => void) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({ 
    category: 'Other',
    amount: '',
    currency: 'USD',
    odometer: '',
    description: '',
    odometerImageKey: undefined
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const createCategoryMutation = useMutation({
    mutationFn: api.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create(vehicleId!, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
      resetForm();
      onSuccess?.(variables);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: any }) => 
      api.expenses.update(vehicleId!, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
      resetForm();
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => api.expenses.delete(vehicleId!, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
    }
  });

  const handleSubmit = async (e: React.FormEvent, categories: string[]) => {
    e.preventDefault();
    
    if (!categories.includes(formData.category)) {
      await createCategoryMutation.mutateAsync(formData.category);
    }
    
    const expenseData: any = { 
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      odometer: parseFloat(formData.odometer),
      description: formData.description
    };
    
    if (formData.odometerImageKey) {
      console.log('Submitting with odometerImageKey:', formData.odometerImageKey);
      expenseData.odometerImageKey = formData.odometerImageKey;
    }
    
    console.log('Final expenseData:', expenseData);
    
    if (editingId) {
      updateMutation.mutate({ expenseId: editingId, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({ 
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      odometer: expense.odometer?.toString() || '',
      description: expense.description || '',
      odometerImageKey: undefined
    });
    setEditingId(expense.expenseId);
  };

  const resetForm = (latestOdometer = '') => {
    setFormData({ 
      category: 'Other', 
      amount: '', 
      currency: 'USD', 
      odometer: latestOdometer, 
      description: '',
      odometerImageKey: undefined
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return {
    formData,
    setFormData,
    editingId,
    setEditingId,
    createMutation,
    updateMutation,
    deleteMutation,
    handleSubmit,
    handleEdit,
    resetForm,
    cancelEdit
  };
}
