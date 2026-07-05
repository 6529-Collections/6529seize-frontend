#!/usr/bin/env python3
"""Validate agent-native JSON files against schema.json definitions.

Usage: python3 validate-schema.py
Exit code: 0 if all files pass, 1 if any fail.
"""
import json
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Files to validate and their schema definition names
FILE_MAP = {
    'api-for-agents.json': 'api_for_agents',
    'on-chain-basics.json': 'on_chain_basics',
    'license-overview.json': 'license_overview',
}

def check_required(data, schema_def, path=""):
    """Lightweight schema validation without jsonschema library.
    Checks required fields and basic type constraints."""
    errors = []
    
    # Get the definition from schema.json
    # We check the 'allOf' chain for common_fields + specific properties
    all_of = schema_def.get('allOf', [schema_def])
    
    for block in all_of:
        required = block.get('required', [])
        properties = block.get('properties', {})
        
        for field in required:
            if field not in data:
                errors.append(f"{path}.{field}: MISSING required field")
        
        for field, field_schema in properties.items():
            if field not in data:
                continue
            val = data[field]
            field_type = field_schema.get('type')
            field_enum = field_schema.get('enum')
            
            # Type check
            if field_type == 'string' and not isinstance(val, str):
                errors.append(f"{path}.{field}: expected string, got {type(val).__name__}")
            elif field_type == 'integer' and not isinstance(val, int):
                errors.append(f"{path}.{field}: expected integer, got {type(val).__name__}")
            elif field_type == 'boolean' and not isinstance(val, bool):
                errors.append(f"{path}.{field}: expected boolean, got {type(val).__name__}")
            elif field_type == 'array' and not isinstance(val, list):
                errors.append(f"{path}.{field}: expected array, got {type(val).__name__}")
            elif field_type == 'object' and not isinstance(val, dict):
                errors.append(f"{path}.{field}: expected object, got {type(val).__name__}")
            
            # Enum check
            if field_enum and val not in field_enum:
                errors.append(f"{path}.{field}: value '{val}' not in enum {field_enum}")
            
            # Date pattern check (simplified)
            if field == 'generated_at' and isinstance(val, str):
                if len(val) != 10 or val[4] != '-' or val[7] != '-':
                    errors.append(f"{path}.{field}: expected YYYY-MM-DD format, got '{val}'")
    
    return errors

def check_array_items(data, field_name, schema_def, path=""):
    """Check array items have required fields."""
    errors = []
    all_of = schema_def.get('allOf', [schema_def])
    
    for block in all_of:
        props = block.get('properties', {})
        if field_name in props and props[field_name].get('type') == 'array':
            items_schema = props[field_name].get('items', {})
            required = items_schema.get('required', [])
            item_props = items_schema.get('properties', {})
            
            arr = data.get(field_name, [])
            for i, item in enumerate(arr):
                if not isinstance(item, dict):
                    errors.append(f"{path}.{field_name}[{i}]: expected object")
                    continue
                for req in required:
                    if req not in item:
                        errors.append(f"{path}.{field_name}[{i}].{req}: MISSING required field")
                
                # Check enum fields in items (skip if no enum — description-only)
                for fname, fschema in item_props.items():
                    if fname in item and 'enum' in fschema:
                        if item[fname] not in fschema['enum']:
                            errors.append(f"{path}.{field_name}[{i}].{fname}: value '{item[fname]}' not in enum {fschema['enum']}")
    
    return errors

def main():
    # Load schema
    schema_path = os.path.join(SCRIPT_DIR, 'schema.json')
    with open(schema_path) as f:
        schema = json.load(f)
    
    all_pass = True
    total_errors = 0
    
    for filename, def_name in FILE_MAP.items():
        filepath = os.path.join(SCRIPT_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  SKIP {filename}: file not found")
            continue
        
        with open(filepath) as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"  FAIL {filename}: invalid JSON — {e}")
                all_pass = False
                total_errors += 1
                continue
        
        schema_def = schema['definitions'].get(def_name)
        if not schema_def:
            print(f"  SKIP {filename}: no schema definition '{def_name}'")
            continue
        
        errors = []
        errors.extend(check_required(data, schema_def, filename))
        
        # Check array items for known array fields
        array_fields = ['endpoints', 'common_queries',
                       'blockchain_basics',
                       'common_on_chain_queries', 'spectrum']
        for af in array_fields:
            errors.extend(check_array_items(data, af, schema_def, filename))
        
        if errors:
            print(f"  FAIL {filename}: {len(errors)} error(s)")
            for e in errors[:10]:
                print(f"    — {e}")
            if len(errors) > 10:
                print(f"    ... and {len(errors) - 10} more")
            all_pass = False
            total_errors += len(errors)
        else:
            print(f"  PASS {filename}")
    
    # Also validate schema.json itself is valid JSON
    print(f"  PASS schema.json (valid JSON, {len(schema['definitions'])} definitions)")
    
    print(f"\n{'='*40}")
    if all_pass:
        print(f"All {len(FILE_MAP)} files validated successfully.")
        return 0
    else:
        print(f"Validation FAILED: {total_errors} error(s) across {len(FILE_MAP)} files.")
        return 1

if __name__ == '__main__':
    sys.exit(main())