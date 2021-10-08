import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TO DO
      const { data: productAdded } = await api.get<Product>(`/products/${productId}`);
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      const updatedCart = [...cart];
      const [hasInCart] = updatedCart.filter(product => product.id === productId);
      const currentAmount = hasInCart ? hasInCart.amount + 1 : 0;

      if (currentAmount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      };

      if (hasInCart) {
        hasInCart.amount = hasInCart.amount + 1
      } else {
        const newProductInCart = {
          id: productAdded.id,
          amount: 1,
          price: productAdded.price,
          title: productAdded.title,
          image: productAdded.image,
        };
        updatedCart.push(newProductInCart);
      };

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch (error) {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const hasIncart = cart.findIndex(product => product.id === productId);

      if (hasIncart < 0) throw new Error()

      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      toast.success('Produto removido do carrinho com sucesso.');
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];
      const hasInCard = updatedCart.find((cart) => cart.id === productId);

      if (hasInCard) {
        hasInCard.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      }
    } catch (err) {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
