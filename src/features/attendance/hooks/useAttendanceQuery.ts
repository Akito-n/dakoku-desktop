import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AttendanceConfig {
  startTime: string;
  endTime: string;
}

export const attendanceQueryKeys = {
  all: ["attendance"] as const,
  config: () => [...attendanceQueryKeys.all, "config"] as const,
} as const;

export const useAttendanceConfig = () => {
  return useQuery({
    queryKey: attendanceQueryKeys.config(),
    queryFn: async (): Promise<AttendanceConfig> => {
      const config = await window.electronAPI.config.getAttendance();
      return config;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
};

export const useUpdateAttendanceConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: AttendanceConfig): Promise<AttendanceConfig> => {
      const result = await window.electronAPI.config.setAttendance(
        config.startTime,
        config.endTime,
      );
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(attendanceQueryKeys.config(), data);
    },
  });
};
