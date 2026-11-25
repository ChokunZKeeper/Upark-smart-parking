"use client";

import { buttonStyles } from "@components/tailgrids/core/button";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronLeft, ChevronRight } from "@tailgrids/icons";
import { cva } from "class-variance-authority";
import {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps
} from "react";
import {
  Button as AriaButton,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  Heading as AriaHeading,
  RangeCalendar as AriaRangeCalendar,
  type CalendarCellRenderProps,
  CalendarHeaderCell,
  ListBox,
  ListBoxItem,
  Popover,
  RangeCalendarStateContext,
  useLocale,
  type CalendarCellProps as AriaCalendarCellProps,
  type RangeCalendarProps as AriaRangeCalendarProps,
  type DateValue,
  type RangeValue
} from "react-aria-components";

/* สีของ range: แก้ที่นี่ที่เดียว */
const RANGE_BAR = "bg-[var(--range-bar)]"; // แถบกลางช่วง (ฟ้าอ่อน)

/* ---------- Root: ไม่มี bg / border / มุมโค้ง / เงา ปล่อยให้กล่องข้างนอกเป็นการ์ดใบเดียว ---------- */
const rangeCalendarStyles = cva(
  "flex w-full max-w-full flex-col rounded-none border-0 bg-transparent p-4 shadow-none sm:p-5"
);

export interface RangeCalendarProps<T extends DateValue> extends Omit<
  AriaRangeCalendarProps<T>,
  "isDisabled" | "isReadOnly"
> {
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export function RangeCalendar<T extends DateValue>({
  className,
  children,
  disabled,
  readonly,
  ...props
}: RangeCalendarProps<T>) {
  return (
    <AriaRangeCalendar
      {...props}
      className={cn(rangeCalendarStyles(), className)}
      isDisabled={disabled}
      isReadOnly={readonly}
    >
      {children}
    </AriaRangeCalendar>
  );
}

const rangeCalendarHeaderStyles = cva(
  "mb-3 flex flex-wrap items-center gap-2 px-1 sm:mb-4 sm:flex-nowrap"
);

export interface RangeCalendarHeaderProps extends ComponentProps<"header"> {}

export function RangeCalendarHeader({
  className,
  ...props
}: RangeCalendarHeaderProps) {
  return (
    <header className={cn(rangeCalendarHeaderStyles(), className)} {...props}>
      {props.children}
    </header>
  );
}

/* ---------- ปุ่มเลื่อนเดือน: เหลี่ยม ไม่มีวงกลม / ring / ขอบ ทุกสถานะ ---------- */
type RangeNavButtonProps = ComponentProps<typeof AriaButton> & {
  slot: "previous" | "next";
};

export function RangeNavButton({
  slot,
  className,
  ...props
}: RangeNavButtonProps) {
  const { direction } = useLocale();

  return (
    <AriaButton
      slot={slot}
      type="button"
      className={cn(
        buttonStyles({
          variant: "ghost",
          iconOnly: true,
          size: "sm"
        }),
        "size-8 shrink-0 rounded-none! border-0! text-text-50 shadow-none! outline-none! sm:size-9",
        "ring-0! ring-offset-0! focus:ring-0! focus:outline-none! focus-visible:ring-0! focus-visible:outline-none! focus-visible:ring-offset-0!",
        "data-[focus-visible=true]:bg-datepicker-selected-hover-background",
        className
      )}
      aria-label={slot === "previous" ? "Previous month" : "Next month"}
      {...props}
    >
      {slot === "previous" ? (
        direction === "rtl" ? (
          <ChevronRight aria-hidden />
        ) : (
          <ChevronLeft aria-hidden />
        )
      ) : direction === "rtl" ? (
        <ChevronLeft aria-hidden />
      ) : (
        <ChevronRight aria-hidden />
      )}
    </AriaButton>
  );
}

type RangeCalendarHeadingProps = ComponentProps<typeof AriaHeading>;

export function RangeCalendarHeading({
  className,
  ...props
}: RangeCalendarHeadingProps) {
  return (
    <AriaHeading
      {...props}
      className={cn("min-w-0 flex-1 text-title-50 text-center", className)}
    />
  );
}

const rangeCalendarGridStyles = cva("w-full border-collapse border-spacing-0");

type RangeCalendarGridProps = ComponentProps<typeof AriaCalendarGrid>;

export function RangeCalendarGrid({
  className,
  ...props
}: RangeCalendarGridProps) {
  return (
    <AriaCalendarGrid
      className={cn(rangeCalendarGridStyles(), className)}
      {...props}
    />
  );
}

type RangeCalendarGridHeaderProps = Omit<
  ComponentProps<typeof AriaCalendarGridHeader>,
  "children"
> & {
  children?: ComponentProps<typeof AriaCalendarGridHeader>["children"];
};

const rangeCalendarGridHeaderCellStyles = cva(
  "table-grid-header-cell pb-2 text-center text-[0.7rem] bg-transparent font-medium uppercase tracking-[0.16em] text-text-100 opacity-60 sm:text-xs"
);

export function RangeCalendarGridHeader({
  className,
  children,
  ...props
}: RangeCalendarGridHeaderProps) {
  if (children) {
    return (
      <AriaCalendarGridHeader
        className={cn(rangeCalendarGridHeaderCellStyles(), className)}
        {...props}
      >
        {children}
      </AriaCalendarGridHeader>
    );
  }

  return (
    <AriaCalendarGridHeader {...props}>
      {(day: string) => (
        <CalendarHeaderCell
          className={cn(rangeCalendarGridHeaderCellStyles(), className)}
        >
          {day}
        </CalendarHeaderCell>
      )}
    </AriaCalendarGridHeader>
  );
}

type RangeCalendarGridBodyProps = ComponentProps<typeof AriaCalendarGridBody>;

export function RangeCalendarGridBody({
  ...props
}: RangeCalendarGridBodyProps) {
  return <AriaCalendarGridBody {...props} />;
}

/* ---------- Cell: วันเริ่ม/สิ้นสุดเป็นวงกลมน้ำเงิน แถบช่วงฟ้าอ่อนอยู่ข้างหลัง ---------- */
const rangeCalendarCellButtonStyles = cva(
  [
    "relative z-10 flex size-10 items-center justify-center sm:size-11",
    "rounded-full border-0 shadow-none ring-0 outline-none",
    "text-sm font-medium text-title-50 transition forced-color-adjust-none [-webkit-tap-highlight-color:transparent]",

    // hover / keyboard focus
    "hover:bg-datepicker-selected-hover-background",
    "data-[focus-visible=true]:bg-datepicker-selected-hover-background",

    // วันนอกเดือน / disabled / unavailable
    "group-data-[outside-month=true]:pointer-events-none data-[outside-month=true]:opacity-35",
    "data-[disabled=true]:cursor-not-allowed",
    "group-[&[data-disabled=true]:not([data-outside-month]):not([data-today])]:text-text-100",
    "group-data-[unavailable=true]:text-text-100",
    "[&[data-disabled=true]:not([data-outside-month])]:line-through",

    // วันนี้
    "group-data-[today=true]:bg-datepicker-selected-background/90 group-data-[today=true]:text-white!",

    // กลางช่วง: พื้นโปร่ง ตัวหนังสือสีปกติ เห็นแถบจาก span ข้างหลัง
    "data-[selected=true]:bg-transparent data-[selected=true]:hover:bg-transparent",

    // วันเริ่ม / วันสุดท้าย: วงกลมน้ำเงิน ตัวหนังสือขาว
    "data-[selection-start=true]:bg-[#3347F5]! data-[selection-end=true]:bg-[#3347F5]!",
    "data-[selection-start=true]:text-white! data-[selection-end=true]:text-white!"
  ].join(" ")
);

interface RangeCalendarCellProps extends Omit<
  AriaCalendarCellProps,
  | "isDisabled"
  | "isFocusVisible"
  | "isOutsideMonth"
  | "isPressed"
  | "isSelected"
> {
  className?: string;
  disabled?: boolean;
  focusVisible?: boolean;
  outsideMonth?: boolean;
  pressed?: boolean;
  selected?: boolean;
  selectionStart?: boolean;
  selectionEnd?: boolean;
}

export function RangeCalendarCell({
  className,
  disabled,
  focusVisible,
  outsideMonth,
  pressed,
  selected,
  selectionStart,
  selectionEnd,
  ...props
}: RangeCalendarCellProps) {
  return (
    <AriaCalendarCell
      {...props}
      className="group bg-transparent p-0 outline-none"
    >
      {({
        formattedDate,
        isDisabled,
        isFocusVisible,
        isOutsideMonth,
        isPressed,
        isSelected,
        isSelectionStart,
        isSelectionEnd
      }: CalendarCellRenderProps) => {
        const inRange = selected ?? isSelected;
        const isStart = selectionStart ?? isSelectionStart;
        const isEnd = selectionEnd ?? isSelectionEnd;

        // วันเริ่ม: แถบครึ่งขวา / วันสุดท้าย: แถบครึ่งซ้าย / ตรงกลาง: เต็มช่อง
        // ถ้าเลือกวันเดียว (เริ่ม = สิ้นสุด) ไม่ต้องมีแถบ
        const barPosition =
          isStart && isEnd
            ? null
            : isStart
              ? "start-1/2 end-0"
              : isEnd
                ? "start-0 end-1/2"
                : "inset-x-0";

        return (
          <span className="relative flex h-10 w-full items-center justify-center sm:h-11">
            {inRange && barPosition && (
              <span
                aria-hidden="true"
                className={cn("absolute inset-y-0", barPosition, RANGE_BAR)}
              />
            )}
            <span
              data-disabled={(disabled ?? isDisabled) || undefined}
              data-focus-visible={(focusVisible ?? isFocusVisible) || undefined}
              data-outside-month={(outsideMonth ?? isOutsideMonth) || undefined}
              data-pressed={(pressed ?? isPressed) || undefined}
              data-selected={inRange || undefined}
              data-selection-start={isStart || undefined}
              data-selection-end={isEnd || undefined}
              className={cn(rangeCalendarCellButtonStyles(), className)}
            >
              {formattedDate}
            </span>
          </span>
        );
      }}
    </AriaCalendarCell>
  );
}

/* ---------- Year picker: เหลี่ยมให้เข้าชุดกัน ---------- */
type YearPickerProps = {
  className?: string;
};

export function RangeCalendarYearPicker({ className }: YearPickerProps) {
  const state = useContext(RangeCalendarStateContext);
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const currentMonth = state?.focusedDate.month ?? new Date().getMonth() + 1;
  const currentYear = state?.focusedDate.year ?? new Date().getFullYear();

  const years = useMemo(() => {
    const yearStart = currentYear - 20;
    return Array.from({ length: 40 }, (_, index) => yearStart + index);
  }, [currentYear]);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale]
  );

  const currentMonthLabel = monthFormatter.format(
    new Date(Date.UTC(2000, currentMonth - 1, 1))
  );

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const listboxElement = listboxRef.current;
      const selectedItem = listboxElement?.querySelector<HTMLElement>(
        "[data-selected='true']"
      );

      if (!listboxElement || !selectedItem) {
        return;
      }

      const targetScrollTop =
        selectedItem.offsetTop -
        listboxElement.clientHeight / 2 +
        selectedItem.clientHeight / 2;

      listboxElement.scrollTop = Math.max(0, targetScrollTop);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen, currentYear]);

  if (!state) {
    return null;
  }

  const focusedDate = state.focusedDate;
  if (!focusedDate) {
    return null;
  }

  const currentDay = focusedDate.day;
  const clampFocusedDateToYear = (year: number) => {
    const safeDate = focusedDate.set({ day: 1, year });
    const maxDay = safeDate.calendar.getDaysInMonth(safeDate);
    return safeDate.set({ day: Math.min(currentDay, maxDay) });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Select year"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(open => !open);
        }}
        className={cn(
          buttonStyles({
            variant: "ghost",
            iconOnly: false,
            size: "sm"
          }),
          "h-10 min-w-20 justify-between rounded-none border border-base-100 bg-background-100 px-3 text-sm font-medium text-title-50 hover:bg-background-soft-200 hover:text-title-50 focus:ring-0 focus-visible:ring-0 sm:min-w-24 sm:h-11",
          className
        )}
      >
        <span>
          {currentMonthLabel} {currentYear}
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-text-100" />
      </button>

      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerRef={triggerRef}
        placement="bottom"
        offset={8}
        className="w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-none border border-base-100 bg-dropdown-background p-0 shadow-md"
      >
        <ListBox
          ref={listboxRef}
          aria-label="Select year"
          autoFocus
          selectionMode="single"
          selectedKeys={[String(currentYear)]}
          disallowEmptySelection
          shouldFocusWrap
          onSelectionChange={keys => {
            if (keys === "all") {
              return;
            }

            const selectedYear = Number([...keys][0]);
            if (Number.isNaN(selectedYear)) {
              return;
            }

            state.setFocusedDate(clampFocusedDateToYear(selectedYear));
            setIsOpen(false);
          }}
          className="max-h-60 overflow-y-auto p-1.5 outline-none sm:max-h-64"
        >
          {years.map(year => (
            <ListBoxItem
              key={year}
              id={String(year)}
              textValue={String(year)}
              className={cn(
                "flex w-full justify-between text-text-50 rounded-none px-3 py-2 text-left text-sm outline-hidden cursor-pointer data-[selected=true]:bg-dropdown-hover-background data-[selected=true]:text-title-50 data-[focused=true]:bg-dropdown-hover-background data-[focused=true]:text-title-50 hover:bg-dropdown-hover-background"
              )}
            >
              {year}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </>
  );
}

export type { DateValue, RangeValue };