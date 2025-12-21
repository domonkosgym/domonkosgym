import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, "A felhasználónév legalább 3 karakter hosszú legyen"),
  password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, isAdmin } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    // Ha már be van jelentkezve és admin, irányítsuk át
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Convert username to email format for Supabase
      const email = `${values.username.toLowerCase()}@admin.local`;
      const { error } = await signIn(email, values.password);
      
      if (error) {
        toast.error("Hibás felhasználónév vagy jelszó");
      } else {
        toast.success("Sikeres bejelentkezés!");
        navigate("/admin");
      }
    } catch (error) {
      toast.error("Hiba történt a bejelentkezés során");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 sm:mb-6 text-white hover:text-primary text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Vissza a főoldalra
        </Button>
        
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 sm:p-8 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Belépés</h1>
            <p className="text-gray-400 text-sm sm:text-base">Jelentkezz be az admin felülethez</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Felhasználónév</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="DomonkosGym"
                        {...field}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-gray-500"
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm">Jelszó</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        {...field}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-gray-500"
                        autoComplete="current-password"
                        showPasswordToggle
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-sm sm:text-base"
              >
                {isLoading ? "Bejelentkezés..." : "Bejelentkezés"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}