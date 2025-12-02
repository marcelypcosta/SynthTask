import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RegisterData } from "../types/register";
import { api, createCancel } from "@/lib/http";
import { toast } from "sonner";

export default function useRegister() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { signal } = createCancel();
      await api.post("/api/auth/register", formData, { signal });
      toast.success("Cadastro realizado com sucesso. Faça login.");
      router.push("/sign-in");
    } catch (err: any) {
      const message = err?.message || "Falha ao registrar";
      setError(message);
      toast.error(message);
    }
  };

  return {
    formData,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  };
}
