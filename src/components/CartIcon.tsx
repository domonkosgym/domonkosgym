import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CartIcon() {
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const itemCount = getItemCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8 sm:h-9 sm:w-9"
      onClick={() => navigate('/cart')}
      aria-label={`Kosár (${itemCount} termék)`}
    >
      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}
