import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

type Base = {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

type ButtonAsButton = Base &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = Base & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return "href" in props && typeof props.href === "string";
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary/90 active:bg-primary/85",
  secondary:
    "bg-accent text-white shadow-sm hover:bg-accent/90 active:bg-accent/85",
  outline:
    "border-2 border-primary bg-white text-primary hover:bg-primary/5 active:bg-primary/10",
};

const baseClasses =
  "inline-flex w-full min-h-14 items-center justify-center gap-3 rounded-xl px-6 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Button(props: ButtonProps) {
  if (isLinkProps(props)) {
    const { href, variant = "primary", className = "", children, icon } = props;
    const combined = `${baseClasses} ${variantClasses[variant]} ${className}`;
    return (
      <Link href={href} className={combined}>
        {icon ? (
          <span className="shrink-0 [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
        ) : null}
        {children}
      </Link>
    );
  }

  const {
    variant = "primary",
    className = "",
    children,
    icon,
    type = "button",
    ...btnProps
  } = props;

  const combined = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button type={type} className={combined} {...btnProps}>
      {icon ? (
        <span className="shrink-0 [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
