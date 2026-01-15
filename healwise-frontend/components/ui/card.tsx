import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

/* ---------------- Card ---------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "bg-white border border-gray-200 rounded-xl p-4",
        className
      )}
    >
      {children}
    </View>
  );
}

/* ---------------- Card Header ---------------- */

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("mb-3", className)}>
      {children}
    </View>
  );
}

/* ---------------- Card Title ---------------- */

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold text-gray-900",
        className
      )}
    >
      {children}
    </Text>
  );
}

/* ---------------- Card Description ---------------- */

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      className={cn(
        "text-sm text-gray-500 mt-1",
        className
      )}
    >
      {children}
    </Text>
  );
}

/* ---------------- Card Content ---------------- */

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("mt-2", className)}>
      {children}
    </View>
  );
}

/* ---------------- Card Footer ---------------- */

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "mt-4 flex-row items-center justify-end border-t border-gray-100 pt-3",
        className
      )}
    >
      {children}
    </View>
  );
}
