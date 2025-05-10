import {
  Button,
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
} from "@tabler/icons-react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import localeData from "dayjs/plugin/localeData";
import ky from "ky";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
} from "react";
import { useLoaderData } from "react-router";

import { apiBase } from "~/config";
import {
  newFromScheduleApiNoTimezone,
  type ScheduleViewModel,
} from "./schedule_viewmodel";

dayjs.extend(localeData);
dayjs.locale("zh-cn");

// @ts-ignore
const ScheduleViewModelContext = createContext<ScheduleViewModel>(null);
const CurrentMonthContext = createContext<{
  currentMonth: dayjs.Dayjs;
  setCurrentMonth: Dispatch<dayjs.Dayjs>;
  // @ts-ignore
}>(null);

function ScheduleTable({ body }: { body: React.ReactNode }): React.ReactNode {
  const localeData = dayjs.localeData();
  const weekdays = [
    ...localeData.weekdaysShort().slice(localeData.firstDayOfWeek()),
    ...localeData.weekdaysShort().slice(0, localeData.firstDayOfWeek()),
  ];

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {weekdays.map((day) => (
            <Table.Th key={day}>{day}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{body}</Table.Tbody>
    </Table>
  );
}

function ScheduleTableCell({
  highlight,
  day,
}: {
  highlight: boolean;
  day: dayjs.Dayjs;
}): React.ReactNode {
  const scheduleViewModel = useContext(ScheduleViewModelContext);
  const theme = useMantineTheme();

  const arrange = scheduleViewModel.arrangeOfDay(day);

  const iconWork = <IconPick color="Black" />;
  const iconBreak = <IconBed color="MediumAquamarine" />;

  return (
    <Stack
      styles={
        highlight
          ? {
              root: {
                backgroundColor:
                  "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6));",
                borderRadius: "var(--mantine-radius-md)",
                boxShadow: "var(--mantine-shadow-xl)",
                border:
                  "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4));",
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
      <div style={arrange === null ? { visibility: "hidden" } : {}}>
        <Flex>
          {arrange?.has(1) ? iconWork : iconBreak}
          <Text size="sm" ml="sm">
            00:00
          </Text>
        </Flex>
        <Flex>
          {arrange?.has(2) ? iconWork : iconBreak}
          <Text size="sm" ml="sm">
            09:00
          </Text>
        </Flex>
        <Flex>
          {arrange?.has(3) ? iconWork : iconBreak}
          <Text size="sm" ml="sm">
            13:00
          </Text>
        </Flex>
        <Flex>
          {arrange?.has(4) ? iconWork : iconBreak}
          <Text size="sm" ml="sm">
            21:00
          </Text>
        </Flex>
      </div>
    </Stack>
  );
}

function ScheduleTableBody({
  highlight,
}: {
  highlight: dayjs.Dayjs | null;
}): React.ReactNode {
  const { currentMonth } = useContext(CurrentMonthContext);

  dayjs.localeData().firstDayOfWeek();
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

  return [...Array(nRows).keys()].map((i) => (
    <Table.Tr key={i}>
      {[...Array(7).keys()].map((j) => (
        <Table.Td key={j}>
          <ScheduleTableCell
            highlight={highlight?.isSame(dayFor(i, j), "day") ?? false}
            day={dayFor(i, j)}
          />
        </Table.Td>
      ))}
    </Table.Tr>
  ));
}

function Schedule({
  highlight,
}: {
  highlight: dayjs.Dayjs | null;
}): React.ReactNode {
  const loaderData = useLoaderData();
  const scheduleViewModel = useMemo(
    () => newFromScheduleApiNoTimezone(loaderData),
    []
  );
  const [currentMonth, setCurrentMonth] = useState(dayjs().set("date", 1));

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
      <ScheduleViewModelContext.Provider value={scheduleViewModel}>
        <CurrentMonthContext.Provider value={{ currentMonth, setCurrentMonth }}>
          <ScheduleTable body={<ScheduleTableBody highlight={highlight} />} />
        </CurrentMonthContext.Provider>
      </ScheduleViewModelContext.Provider>
    </Container>
  );
}

export async function loader() {
  return await ky
    .get("shifts", {
      prefixUrl: apiBase,
    })
    .json();
}

export function HydrateFallback(): React.ReactNode {
  return <Schedule highlight={null} />;
}

export default function Index(): React.ReactNode {
  return <Schedule highlight={dayjs()} />;
}
