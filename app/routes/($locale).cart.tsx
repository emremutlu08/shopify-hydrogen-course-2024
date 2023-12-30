import {Await, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import type {CartQueryData} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {json, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {CartMain} from '~/components/Cart';
import {useRootLoaderData} from '~/root';

export const meta: MetaFunction = () => {
  return [{title: `Hydrogen | Cart`}];
};

export async function action({request, context}: ActionFunctionArgs) {
  const {session, cart} = context;

  const currentCart = await cart.get();

  const [formData, customerAccessToken] = await Promise.all([
    request.formData(),
    session.get('customerAccessToken'),
  ]);

  const {action, inputs} = CartForm.getFormInput(formData);
  console.log(JSON.stringify(currentCart, null, 2), 'currentCart');
  const item = currentCart?.lines?.nodes?.find(
    (el) => el?.id === (inputs?.lines?.[0]?.id || inputs?.lineIds?.[0]),
  );
  console.log(JSON.stringify(item, null, 2), 'item');

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryData;
  console.log(JSON.stringify(inputs.lines, null, 2), 'inputs.lines');

  const giftProduct = item?.merchandise?.product?.giftProduct?.value;

  console.log(giftProduct, 'giftProduct');

  if (giftProduct) {
    if (inputs?.lines) {
      console.log('update gift');
      const updatedQuantity =
        Number(inputs?.['decrease-quantity']) - 1 ||
        Number(inputs?.['increase-quantity']) + 1;
      inputs.lines[0].quantity = updatedQuantity;
    } else {
      console.log('remove gift');
      const removeThose = currentCart?.lines?.nodes?.filter(
        (el) => el?.merchandise?.product?.giftProduct?.value === giftProduct,
      );
      const removeThoseIds = removeThose?.map((el) => el?.id);
      inputs.lineIds = removeThoseIds;
    }
  }

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
        customerAccessToken: customerAccessToken?.accessToken,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result.cart.id;
  const headers = cart.setCartId(result.cart.id);
  const {cart: cartResult, errors} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return json(
    {
      cart: cartResult,
      errors,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export default function Cart() {
  const rootData = useRootLoaderData();
  const cartPromise = rootData.cart;

  return (
    <div className="cart">
      <h1>Cart</h1>
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await
          resolve={cartPromise}
          errorElement={<div>An error occurred</div>}
        >
          {(cart) => {
            return <CartMain layout="page" cart={cart} />;
          }}
        </Await>
      </Suspense>
    </div>
  );
}
