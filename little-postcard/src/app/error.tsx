"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-24">
      <ErrorState
        title="Tấm bưu thiếp này chưa thể mở ra lúc này."
        description="Có lỗi xảy ra khi tải trang. Bạn thử lại, hoặc quay về trang chủ nhé."
      >
        <Button onClick={() => retry()}>Thử lại</Button>
        <Button asChild variant="outline">
          <Link href={routes.home}>Về trang chủ</Link>
        </Button>
      </ErrorState>
    </Container>
  );
}
