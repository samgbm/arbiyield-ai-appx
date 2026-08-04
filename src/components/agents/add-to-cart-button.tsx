"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";

export function AddToCartButton({
  agentId,
  size = "lg",
}: {
  agentId: string;
  size?: "md" | "lg";
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size={size}
      className="w-full sm:w-auto"
      onClick={() => {
        addItem(agentId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? (
        <>
          <Check className="size-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" />
          Add to cart
        </>
      )}
    </Button>
  );
}
