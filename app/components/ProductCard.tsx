import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  MoneyV2,
  Product,
  Image as ImageType,
} from '@shopify/hydrogen/storefront-api-types';

export default function ProductCard({
  product,
}: {
  product: Pick<Product, 'id' | 'title' | 'handle'> & {
    priceRange: {
      minVariantPrice: Pick<MoneyV2, 'amount' | 'currencyCode'>;
    };
    images: {
      nodes: Array<
        Pick<ImageType, 'id' | 'url' | 'altText' | 'width' | 'height'>
      >;
    };
  };
}) {
  return (
    <Link
      key={product.id}
      className="recommended-product"
      to={`/products/${product.handle}`}
    >
      <Image
        data={product.images.nodes[0]}
        aspectRatio="1/1"
        sizes="(min-width: 45em) 20vw, 50vw"
      />
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}
