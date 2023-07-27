import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import styles from "./MultiSelectDropdown.module.scss";

interface Props {
  label: string;
  options: { id: number; label: string; description?: string }[];
}

export default function MultiSelectDropdown(props: Props) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionChange = (event: any) => {
    const optionId = parseInt(event.target.value);
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedOptions([...selectedOptions, optionId].sort((a, b) => a - b));
    } else {
      setSelectedOptions(
        selectedOptions.filter((id) => id !== optionId).sort((a, b) => a - b)
      );
    }
  };

  return (
    <>
      <div className={`dropdown ${isOpen ? "show" : ""}`}>
        <Button
          id="multiSelectDropdown"
          className={`${styles.dropdownButton} dropdown-toggle`}
          type="button"
          onClick={toggleDropdown}>
          {props.label}
          {selectedOptions.length > 0 ? ` (${selectedOptions.length})` : ``}
        </Button>
        <div
          className={`dropdown-menu ${styles.dropdownMenu} ${
            isOpen ? "show" : ""
          }`}
          aria-labelledby="multiSelectDropdown">
          {props.options.map((option) => (
            <Form.Check
              className={styles.dropdownOption}
              key={option.id}
              type="checkbox"
              id={`option_${option.id}`}
              label={
                <>
                  {option.label}
                  {option.description ? (
                    <span className={styles.description}>
                      {" "}
                      {option.description}
                    </span>
                  ) : (
                    ``
                  )}
                </>
              }
              checked={selectedOptions.includes(option.id)}
              onChange={handleOptionChange}
              value={option.id}
            />
          ))}
        </div>
      </div>
      <div className="pt-3 d-flex flex-column">
        {selectedOptions.map((o) => (
          <span className="pb-1">
            {props.options.find((p) => p.id == o)?.label}
          </span>
        ))}
      </div>
    </>
  );
}
