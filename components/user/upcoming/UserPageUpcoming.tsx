import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";

export default function UserPageUpcoming({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const slug = router.query.slug as string;

  const people = [
    {
      name: "Leslie Alexander",
      email: "leslie.alexander@example.com",
      role: "Co-Founder / CEO",
      imageUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: "3h ago",
      lastSeenDateTime: "2023-01-23T13:23Z",
    },
    {
      name: "Michael Foster",
      email: "michael.foster@example.com",
      role: "Co-Founder / CTO",
      imageUrl:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: "3h ago",
      lastSeenDateTime: "2023-01-23T13:23Z",
    },
    {
      name: "Dries Vincent",
      email: "dries.vincent@example.com",
      role: "Business Relations",
      imageUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: null,
    },
    {
      name: "Lindsay Walton",
      email: "lindsay.walton@example.com",
      role: "Front-end Developer",
      imageUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: "3h ago",
      lastSeenDateTime: "2023-01-23T13:23Z",
    },
    {
      name: "Courtney Henry",
      email: "courtney.henry@example.com",
      role: "Designer",
      imageUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: "3h ago",
      lastSeenDateTime: "2023-01-23T13:23Z",
    },
    {
      name: "Tom Cook",
      email: "tom.cook@example.com",
      role: "Director of Product",
      imageUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastSeen: null,
    },
  ];
  return (
    <ul role="list" className="tw-divide-y tw-divide-gray-800">
      {people.map((person) => (
        <li
          key={person.email}
          className="tw-flex tw-justify-between tw-gap-x-6 tw-py-5"
        >
          <div className="tw-flex tw-min-w-0 tw-gap-x-4">
            <img
              className="tw-h-12 tw-w-12 tw-flex-none tw-rounded-full tw-bg-gray-800"
              src={person.imageUrl}
              alt=""
            />
            <div className="tw-min-w-0 tw-flex-auto">
              <p className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-white">
                {person.name}
              </p>
              <p className="tw-mt-1 tw-truncate tw-text-xs tw-leading-5 tw-text-gray-400">
                {person.email}
              </p>
            </div>
          </div>
          <div className="tw-hidden tw-shrink-0 tw-sm:flex tw-flex-col tw-items-end">
            <p className="tw-text-sm tw-leading-6 tw-text-white">
              {person.role}
            </p>
            {person.lastSeen ? (
              <p className="tw-mt-1 tw-text-xs tw-leading-5 tw-text-gray-400">
                Last seen{" "}
                <time dateTime={person.lastSeenDateTime}>
                  {person.lastSeen}
                </time>
              </p>
            ) : (
              <div className="tw-mt-1 tw-flex tw-items-center tw-gap-x-1.5">
                <div className="tw-flex-none tw-rounded-full tw-bg-emerald-500/20 tw-p-1">
                  <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-emerald-500" />
                </div>
                <p className="tw-text-xs tw-leading-5 tw-text-gray-400">
                  Online
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
