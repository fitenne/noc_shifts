import {
  Button,
  Center,
  Container,
  Flex,
  Group,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBed,
  IconChevronLeft,
  IconChevronRight,
  IconPick,
  IconLoader,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import localeData from "dayjs/plugin/localeData";
import ky from "ky";
import { createContext, useContext, useMemo, useState } from "react";

import { API_BASE } from "~/config";
import type { Route } from "./+types/route";
import {
  newFromScheduleApiNoTimezone,
  type ScheduleViewModel,
} from "./schedule_viewmodel";

dayjs.extend(localeData);
dayjs.locale("zh-cn");

const ScheduleViewModelContext = createContext<ScheduleViewModel | null>(null);

function ScheduleTableCell({
  highlight,
  day,
}: {
  highlight: boolean;
  day: dayjs.Dayjs;
}): React.ReactNode {
  const scheduleViewModel = useContext(ScheduleViewModelContext);
  const theme = useMantineTheme();

  const noScheduleData = scheduleViewModel === null;
  const arrange = scheduleViewModel?.arrangeOfDay(day);

  const iconWork = <IconPick color="Black" />;
  const iconBreak = <IconBed color="MediumAquamarine" />;

  const iconsForThisDay = [...Array(4).keys()].map((i) =>
    arrange?.has((i + 1) as 1 | 2 | 3 | 4) ? iconWork : iconBreak
  );

  return (
    <Stack
      styles={
        highlight
          ? {
              root: {
                backgroundColor:
                  "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
                borderRadius: "var(--mantine-radius-md)",
                boxShadow: "var(--mantine-shadow-xl)",
                border:
                  "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))",
              },
            }
          : undefined
      }
      style={{ padding: theme.spacing.sm }}
      align="center"
      justify="center"
      gap="xs"
    >
      <Text>{day.date()}</Text>
      {[...Array(4).keys()].map((i) => (
        <Flex key={i}>
          {noScheduleData ? <IconLoader /> : iconsForThisDay[i]}
          <Text size="sm" ml="sm">
            {["00:00", "09:00", "13:00", "21:00"][i]}
          </Text>
        </Flex>
      ))}
    </Stack>
  );
}

const _render_body = (
  currentMonth: dayjs.Dayjs,
  highlight: dayjs.Dayjs | null
) => {
  const nDaysBeforeFirstDay =
    (currentMonth.startOf("month").day() -
      dayjs.localeData().firstDayOfWeek() +
      7) %
    7;
  const nRows = Math.ceil(
    (nDaysBeforeFirstDay + currentMonth.daysInMonth()) / 7
  );

  const dayFor = (i: number, j: number) => {
    const offsetSinceFirstDay = i * 7 + j - nDaysBeforeFirstDay;
    return currentMonth.startOf("month").add(offsetSinceFirstDay, "day");
  };

  return [...Array(nRows).keys()].map((i) =>
    [...Array(7).keys()].map((j) => (
      <ScheduleTableCell
        highlight={highlight?.isSame(dayFor(i, j), "day") ?? false}
        day={dayFor(i, j)}
      />
    ))
  );
};

function ScheduleTable({
  highlight,
}: {
  highlight: dayjs.Dayjs | null;
}): React.ReactNode {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));

  const localeData = dayjs.localeData();
  const weekdays = [
    ...localeData.weekdaysShort().slice(localeData.firstDayOfWeek()),
    ...localeData.weekdaysShort().slice(0, localeData.firstDayOfWeek()),
  ];

  const tableData = {
    head: weekdays.map((day) => <Center>{day}</Center>),
    body: _render_body(currentMonth, highlight),
  };

  return (
    <Container>
      <Flex style={{ justifyContent: "space-between" }} align="center" m="md">
        <Text>{dayjs().format("MMM YYYY")}</Text>
        <Group>
          <Button
            variant="subtle"
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
          >
            <IconChevronLeft />
          </Button>
          <Button
            variant="subtle"
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
          >
            <IconChevronRight />
          </Button>
        </Group>
      </Flex>
      <Table data={tableData} />
    </Container>
  );
}

export async function loader(): Promise<{ schedule: Array<object> }> {
  return await ky
    .get("shifts", {
      prefixUrl: API_BASE,
    })
    .json();
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  return await serverLoader();
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <ScheduleTable highlight={null} />;
}

export default function Index({
  loaderData,
}: {
  loaderData: Route.LoaderArgs;
}): React.ReactNode {
  const scheduleViewModel = useMemo(
    // @ts-ignore
    () => newFromScheduleApiNoTimezone(loaderData),
    [loaderData]
  );

  return (
    <ScheduleViewModelContext.Provider value={scheduleViewModel}>
      <ScheduleTable highlight={dayjs()} />
    </ScheduleViewModelContext.Provider>
  );
}
