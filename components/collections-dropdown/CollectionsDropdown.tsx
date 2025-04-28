import styles from "./CollectionsDropdown.module.scss";
import { Dropdown } from "react-bootstrap";
import { useRouter } from "next/router";

type CollectionType = "memes" | "gradient" | "nextgen" | "memelab" | "rememes";

interface CollectionItem {
  id: CollectionType;
  name: string;
  path: string;
}

const COLLECTIONS: CollectionItem[] = [
  { id: "memes", name: "The Memes", path: "/the-memes" },
  { id: "gradient", name: "Gradient", path: "/6529-gradient" },
  { id: "nextgen", name: "NextGen", path: "/nextgen" },
  { id: "memelab", name: "Meme Lab", path: "/meme-lab" },
  { id: "rememes", name: "ReMemes", path: "/rememes" }
];

interface Props {
  activePage: CollectionType;
}

export default function CollectionsDropdown(props: Readonly<Props>) {
  const router = useRouter();
  const activeCollection = COLLECTIONS.find(c => c.id === props.activePage) || COLLECTIONS[0];
  
  const handleSelect = (collectionPath: string) => {
    router.push(collectionPath);
  };
  
  return (
    <Dropdown className={styles.collectionsDropdown}>
      <Dropdown.Toggle variant="outline-light">
        {activeCollection.name}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {COLLECTIONS.map((collection) => (
          <Dropdown.Item
            key={`collection-${collection.id}`}
            active={collection.id === props.activePage}
            onClick={() => handleSelect(collection.path)}>
            {collection.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}