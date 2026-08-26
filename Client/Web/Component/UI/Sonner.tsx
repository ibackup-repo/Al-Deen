import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as Toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          Toast:
            "group Toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-black group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-black dark:group-[.toaster]:border-white group-[.toaster]:shadow-lg rounded-[40px]",
          title: "group-[.Toast]:font-semibold group-[.Toast]:text-foreground",
          description: "group-[.Toast]:text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70",
          actionButton:
            "group-[.Toast]:bg-black dark:group-[.Toast]:bg-white group-[.Toast]:text-white dark:group-[.Toast]:text-black group-[.Toast]:rounded-[40px] group-[.Toast]:px-4 group-[.Toast]:py-2 group-[.Toast]:text-sm group-[.Toast]:font-medium group-[.Toast]:transition-all group-[.Toast]:Duration-200",
          cancelButton:
            "group-[.Toast]:bg-muted group-[.Toast]:text-muted-foreground group-[.Toast]:rounded-[40px] group-[.Toast]:px-4 group-[.Toast]:py-2 group-[.Toast]:text-sm group-[.Toast]:font-medium group-[.Toast]:transition-all group-[.Toast]:Duration-200",
          closeButton:
            "group-[.Toast]:rounded-full group-[.Toast]:bg-black/10 dark:group-[.Toast]:bg-white/10 group-[.Toast]:p-1 group-[.Toast]:transition-all group-[.Toast]:Duration-200 group-[.Toast]:hover:bg-black/20 dark:group-[.Toast]:hover:bg-white/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, Toast };