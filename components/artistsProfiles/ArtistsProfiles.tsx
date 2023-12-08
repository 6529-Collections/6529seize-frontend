import styles from "./ArtistsProfiles.module.scss";
import { useState, useEffect } from "react";
import { parseArtistName } from "../../helpers/Helpers";

interface Props {
  artists: string[];
}

export default function ArtistsProfiles(props: Readonly<Props>) {
  const [artistsProfiles, setArtistsProfiles] = useState<
    {
      [artist: string]: string;
    }[]
  >([]);

  function fetchArtistProfile(artist: string) {
    return fetch(`${process.env.API_ENDPOINT}/api/profiles/${artist}`);
  }

  async function getHandle(response: Response) {
    const json = await response.json();
    return json.profile.handle;
  }

  function handleOkResponse(response: Response, artist: string) {
    getHandle(response).then((handle) => {
      setArtistsProfiles((artistsProfiles) => [
        ...artistsProfiles,
        { [artist]: handle },
      ]);
    });
  }

  useEffect(() => {
    if (props.artists) {
      props.artists.forEach((artist) => {
        const parsedArtist = parseArtistName(artist);
        fetchArtistProfile(parsedArtist).then((response) => {
          if (response.ok) {
            handleOkResponse(response, artist);
          } else if (parsedArtist.includes("-")) {
            const parsedArtist2 = parsedArtist.replaceAll("-", "");
            fetchArtistProfile(parsedArtist2).then((response) => {
              if (response.ok) {
                handleOkResponse(response, artist);
              }
            });
          }
        });
      });
    }
  }, [props.artists]);

  function printArtist(name: string) {
    const artistWithProfile = artistsProfiles.find((a) => a[name]);
    if (artistWithProfile) {
      return <a href={`/${artistWithProfile[name]}`}>{name}</a>;
    }
    return name;
  }

  const artistElements = props.artists.reduce(
    (acc: (string | JSX.Element)[], artist: string, index: number) => {
      acc.push(printArtist(artist));
      if (index < props.artists.length - 1) {
        acc.push(", ");
      }
      return acc;
    },
    []
  );

  return <>{artistElements}</>;
}
