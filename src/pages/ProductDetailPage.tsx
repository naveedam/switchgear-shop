
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { fetchCategoryProducts } from "@/services/productService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Currency } from "@/components/ui/currency";
import { ShoppingCart, ArrowLeft, Star, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const ProductDetailPage: React.FC = () => {
  const { productSlug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Simulate fetch all products, then find by slug (since mock backend)
    fetchCategoryProducts({}, 1, 100).then(res => {
      const found = res.products.find(p => p.slug === productSlug);
      setProduct(found || null);
      setActiveImage(found?.images?.[0] || found?.featuredImage || null);
      setLoading(false);
    });
  }, [productSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="text-center text-lg">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="text-center text-lg text-red-600">Product not found.</div>
        <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const lowestPrice =
    product.variants.reduce((min, v) => Math.min(min, v.salePrice ?? v.price), Infinity);

  const highestPrice =
    product.variants.reduce((max, v) => Math.max(max, v.salePrice ?? v.price), 0);

  const inStock = product.variants.some(v => v.stock > 0);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-wrap gap-8">
        {/* Images */}
        <div className="flex flex-col gap-3 w-full md:w-1/2">
          <div className="border rounded-lg overflow-hidden bg-white">
            <img
              src={activeImage || product.featuredImage}
              alt={product.name}
              className="w-full h-80 object-contain bg-white"
            />
          </div>
          <div className="flex gap-2">
            {[product.featuredImage, ...(product.images || [])]
              .filter((img, idx, arr) => arr.indexOf(img) === idx)
              .slice(0, 5)
              .map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`border rounded w-14 h-14 bg-white p-0.5 overflow-hidden ${
                    (activeImage || product.featuredImage) === img
                      ? "ring-2 ring-brand-600 ring-offset-2"
                      : ""
                  }`}
                >
                  <img src={img} alt={`thumb${i}`} className="object-contain w-full h-full" />
                </button>
              ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center text-gray-600 text-sm mb-1 gap-2">
            <Link to={`/sellers/${product.sellerId}`} className="hover:text-brand-700">
              {product.sellerName}
            </Link>
            <span>•</span>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
              {product.rating.toFixed(1)} <span className="ml-1">({product.reviewCount})</span>
            </div>
          </div>
          <div className="mb-2">
            {product.categories.map(cat => (
              <Link to={`/categories/${cat.slug}`} key={cat.id}>
                <Badge variant="outline" className="mr-2 bg-gray-50">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
          <div className="text-lg font-semibold mb-2">
            {lowestPrice === highestPrice ? (
              <Currency value={lowestPrice} />
            ) : (
              <>
                <Currency value={lowestPrice} /> - <Currency value={highestPrice} />
              </>
            )}
          </div>
          {!inStock && <Badge variant="destructive">Out of Stock</Badge>}
          <p className="text-gray-700 text-base mt-3 mb-2">
            {product.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.variants.map(variant => (
              <Badge key={variant.id} variant="secondary">
                {variant.name}: <Currency value={variant.salePrice ?? variant.price} /> ({variant.stock} in stock)
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="default"
              disabled={!inStock}
              onClick={() =>
                addToCart({
                  productId: product.id,
                  name: product.name,
                  price: product.variants[0]?.salePrice ?? product.variants[0]?.price ?? 0,
                  featuredImage: product.featuredImage
                })
              }
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/cart")}
            >
              Go to Cart <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Specs Table */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Specifications</h2>
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((spec, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1 pr-4 capitalize font-medium text-gray-700">{spec.name}</td>
                    <td className="py-1 text-gray-900">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetailPage;
