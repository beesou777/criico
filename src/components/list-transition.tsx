'use client';

import {
  createContext,
  useContext,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

type ListNavigation = { pending: boolean; navigate: (href: string) => void };
const ListNavigationContext = createContext<ListNavigation | null>(null);

export function ListTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) =>
    startTransition(() => router.push(href, { scroll: false }));

  return (
    <ListNavigationContext.Provider value={{ pending, navigate }}>
      <div className="list-transition" data-pending={pending} aria-busy={pending}>
        <span
          className="sr-only"
          role="status"
        >
          {pending ? 'Updating results…' : ''}
        </span>
        {children}
      </div>
    </ListNavigationContext.Provider>
  );
}

export function useListNavigation(): ListNavigation {
  const context = useContext(ListNavigationContext);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    context ?? {
      pending,
      navigate: (href) =>
        startTransition(() => router.push(href, { scroll: false })),
    }
  );
}

export function navigateListLink(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  navigate: ListNavigation['navigate'],
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  navigate(href);
}
