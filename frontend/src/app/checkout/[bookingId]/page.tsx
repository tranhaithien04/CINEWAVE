import { CheckoutPage } from "@/views/checkout-page";

export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return <CheckoutPage bookingId={bookingId} />;
}
