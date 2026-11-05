import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ApiClient } from "~/api/api-client";
import { getTranslatedApiErrorMessage } from "~/api/utils/getTranslatedApiErrorMessage";
import { invalidateCourseListData } from "~/api/utils/invalidateCourseListData";
import { useToast } from "~/components/ui/use-toast";

export const useDeleteManyCourses = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) =>
      await ApiClient.api.courseControllerDeleteManyCourses({ ids }),
    onSuccess: async () => {
      await invalidateCourseListData();

      toast({
        description: t("adminCoursesView.toast.deleteCourseSuccessfully"),
      });
    },
    onError: (error) => {
      toast({
        description: getTranslatedApiErrorMessage(
          error,
          t,
          t("adminCoursesView.toast.deleteCourseFailed"),
        ),
        variant: "destructive",
      });
    },
  });
};
