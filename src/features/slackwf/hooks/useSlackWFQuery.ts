import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SlackWFConfig {
  workspaceName: string;
  googleEmail: string;
  googlePassword: string;
  targetChannelUrl: string;
  url: string;
  isConfigured: boolean;
}

export const slackwfQueryKeys = {
  all: ["slackwf"] as const,
  config: () => [...slackwfQueryKeys.all, "config"] as const,
} as const;

export const useSlackWFConfig = () => {
  return useQuery({
    queryKey: slackwfQueryKeys.config(),
    queryFn: async (): Promise<SlackWFConfig> => {
      const config = await window.electronAPI.config.getSlackWF();
      return config;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
};

export const useUpdateSlackWFCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceName,
      googleEmail,
      googlePassword,
    }: {
      workspaceName: string;
      googleEmail: string;
      googlePassword: string;
    }) => {
      const result = await window.electronAPI.config.setSlackWFCredentials(
        workspaceName,
        googleEmail,
        googlePassword,
      );
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        slackwfQueryKeys.config(),
        (old: SlackWFConfig | undefined) => {
          if (!old) return undefined;
          return {
            ...old,
            workspaceName: data.workspaceName,
            googleEmail: data.googleEmail,
            googlePassword: data.googlePassword,
            targetChannelUrl: data.targetChannelUrl,
            isConfigured: data.isConfigured,
          };
        },
      );
    },
  });
};

export const useUpdateSlackWFUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string): Promise<{ url: string }> => {
      const result = await window.electronAPI.config.setSlackWFUrl(url);
      return result;
    },
    onSuccess: (data, url) => {
      queryClient.setQueryData(
        slackwfQueryKeys.config(),
        (old: SlackWFConfig | undefined) => (old ? { ...old, url } : undefined),
      );
    },
  });
};

export const useUpdateSlackWFChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetChannelUrl: string) => {
      const result =
        await window.electronAPI.config.setSlackWFChannel(targetChannelUrl);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        slackwfQueryKeys.config(),
        (old: SlackWFConfig | undefined) => {
          if (!old) return undefined;
          return {
            ...old,
            workspaceName: data.workspaceName,
            googleEmail: data.googleEmail,
            googlePassword: data.googlePassword,
            targetChannelUrl: data.targetChannelUrl,
          };
        },
      );
    },
  });
};

export const useClearSlackWFConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await window.electronAPI.config.clearSlackWF();
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        slackwfQueryKeys.config(),
        (old: SlackWFConfig | undefined) => {
          if (!old) return undefined;
          return {
            ...old,
            workspaceName: data.workspaceName,
            googleEmail: data.googleEmail,
            googlePassword: data.googlePassword,
            targetChannelUrl: data.targetChannelUrl,
            isConfigured: data.isConfigured,
          };
        },
      );
    },
  });
};

export const useTestSlackWFConfig = () => {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const result = await window.electronAPI.config.testSlackWF();
      return result;
    },
  });
};
