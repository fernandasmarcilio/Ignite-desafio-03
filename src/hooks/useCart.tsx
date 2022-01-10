import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartProductFound = cart.find( product => product.id === productId);

      if(cartProductFound) {
        const amount = cartProductFound.amount + 1;
        updateProductAmount({ productId, amount });
      } else {
        const { data: product } = await api.get<Product>(`products/${productId}`);

        const newProduct = {
          ...product,
          amount: 1,
        }

        setCart([
          ...cart, 
          newProduct
        ])

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([
          ...cart, 
          newProduct
        ]));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const indexProductCart = newCart.findIndex( product => product.id === productId);
      
      if( indexProductCart >= 0 ) {
        newCart.splice( indexProductCart, 1 );
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if( amount <=  0) return;

      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if( amount <= stock.amount ) {
        const newCart = cart.map( product => {
          return product.id === productId ? {...product, amount } : product;
        });
  
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
