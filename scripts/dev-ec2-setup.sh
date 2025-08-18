prompt_choice() {
  # args: var_name question default_value option1_label option1_value option2_label option2_value ...
  local __varname="$1"; shift
  local question="$1"; shift
  local default="$1"; shift

  exec 3</dev/tty || true

  color cyan "$question"
  declare -a labels
  declare -a values
  while (( "$#" )); do
    local label="$1"; local val="$2"
    labels+=("$label"); values+=("$val")
    shift 2
  done

  for i in "${!labels[@]}"; do
    local n=$((i+1))
    if [[ "${values[$i]}" == "$default" ]]; then
      echo "  $n) ${labels[$i]} [default]"
    else
      echo "  $n) ${labels[$i]}"
    fi
  done

  local choice=""
  read -u 3 -r -p "Choose [1-${#labels[@]}] ($default): " choice || true

  if [[ -z "$choice" ]]; then
    printf -v "$__varname" '%s' "$default"
  else
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#labels[@]} )); then
      color yellow "Invalid choice. Using default ($default)."
      printf -v "$__varname" '%s' "$default"
    else
      local idx=$((choice-1))
      printf -v "$__varname" '%s' "${values[$idx]}"
    fi
  fi

  exec 3<&- || true
}