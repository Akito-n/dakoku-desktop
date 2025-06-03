import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface JobcanConfig {
  email: string;
  password: string;
  url: string;
  isConfigured: boolean;
}

export const jobcanQueryKeys = {
  all: ["jobcan"] as const,
  config: () => [...jobcanQueryKeys.all, "config"] as const,
} as const;

export const useJobcanConfig = () => {
  return useQuery({
    queryKey: jobcanQueryKeys.config(),
    queryFn: async (): Promise<JobcanConfig> => {
      const config = await window.electronAPI.config.getJobcan();
      return config;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
};

export const useUpdateJobcanCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: { email: string; password: string }): Promise<JobcanConfig> => {
      await window.electronAPI.config.setJobcanCredentials(email, password);
      return await window.electronAPI.config.getJobcan();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(jobcanQueryKeys.config(), data);
    },
  });
};

export const useUpdateJobcanUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string): Promise<{ url: string }> => {
      const result = await window.electronAPI.config.setJobcanUrl(url);
      return result;
    },
    onSuccess: (_data, url) => {
      queryClient.setQueryData(
        jobcanQueryKeys.config(),
        (old: JobcanConfig | undefined) => (old ? { ...old, url } : undefined),
      );
    },
  });
};

export const useClearJobcanConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<JobcanConfig> => {
      await window.electronAPI.config.clearJobcan();
      return await window.electronAPI.config.getJobcan();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(jobcanQueryKeys.config(), data);
    },
  });
};

export const useTestJobcanConfig = () => {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const result = await window.electronAPI.config.testJobcan();
      return result;
    },
  });
};
