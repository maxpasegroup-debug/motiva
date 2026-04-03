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
    "bg-gradient-to-b from-[#0B5ED7] to-[#3B82F6] text-white shadow-lg shadow-[#0B5ED7]/28 " +
    "motion-safe:hover:scale-105 motion-safe:active:scale-[1.02] hover:shadow-xl hover:shadow-[#0B5ED7]/35 active:brightness-95",
  secondary:
    "bg-accent text-white shadow-sm " +
    "motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] hover:bg-accent/90 hover:shadow-md active:bg-accent/85",
  outline:
    "border-2 border-primary bg-white text-primary shadow-md shadow-neutral-900/10 " +
    "motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] " +
    "hover:bg-white hover:border-primary hover:shadow-lg active:bg-neutral-50",
};

const baseClasses =
  "inline-flex w-full min-h-[3.25rem] touch-manipulation items-center justify-center gap-3 rounded-2xl px-6 text-center text-base font-semibold sm:min-h-14 " +
  "transition-[transform,box-shadow,filter,background-color,border-color] duration-200 ease-out " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function IconSlot({ icon }: { icon: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center text-xl leading-none [&>svg]:h-6 [&>svg]:w-6">
      {icon}
    </span>
  );
}

export function Button(props: ButtonProps) {
  if (isLinkProps(props)) {
    const { href, variant = "primary", className = "", children, icon } = props;
    const combined = `${baseClasses} ${variantClasses[variant]} ${className}`;
    return (
      <Link href={href} className={combined}>
        {icon ? <IconSlot icon={icon} /> : null}
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
      {icon ? <IconSlot icon={icon} /> : null}
      {children}
    </button>
  );
}
