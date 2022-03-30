import { InputAdornment, TextField } from "@mui/material"
import { height, margin } from "@mui/system"

const InputComponent = (props: {
    data: InputData
    label: string
    unit?: string
    type?: string
    onChange?: (value: string) => void
}) => {
    const { unmatched, error, pattern, assert } = props.data.data
    props.data.setInputErrors(pattern, assert)
    return (
        <TextField
            className="text-field-container"
            sx={{
                mx: 1,
                flex: 2,
                flexBasis: 0,
                fontSize: "40px"
            }}
            label={props.label}
            variant="outlined"
            margin="normal"
            size="small"
            type={props.type}
            InputProps={{
                ...(props.unit === undefined
                    ? {}
                    : {
                          endAdornment: <InputAdornment position="end">{props.unit}</InputAdornment>
                      }),
                ...(pattern === undefined
                    ? {}
                    : {
                          pattern: pattern
                      }),
                     style: {
                         fontSize: "1.5rem",
                         height: "50px"
                     }
            }}
            InputLabelProps={{
                shrink: true,
            }}
            value={unmatched}
            error={error}
            helperText={
                error && pattern !== undefined && unmatched.match(pattern) === null
                    ? "Invalid input value"
                    : assert !== undefined && assert.some(a => a.test(unmatched))
                    ? assert!
                          .filter(a => a.test(unmatched))
                          .map(a => a.msg())
                          .reduce((a, b) => a + "\n" + b)
                    : ""
            }
            onChange={e => {
                props.data.setInputValues(e.target.value, pattern)
                props.data.setInputErrors(pattern, assert)
                props?.onChange?.(e.target.value)
                window.updatePage()
            }}
        />
    )
}

class InputData {
    data: {
        value: string
        unmatched: string
        error: boolean
        pattern?: RegExp
        assert?: Array<{ test: (value: string) => boolean; msg: () => string }>
    }

    constructor(init: {
        value: string
        pattern?: RegExp
        type?: string
        assert?: Array<{ test: (value: string) => boolean; msg: () => string }>
    }) {
        this.data = {
            ...init,
            unmatched: "",
            error: false
        }

        this.setInputValues(this.data.value)
        this.setInputErrors(this.data.pattern, this.data.assert)
    }

    setInputValues(val: string, pattern?: RegExp, fallback: string = "0") {
        this.data.unmatched = val
        this.data.value = pattern !== undefined ? (val.match(pattern) !== null ? val : fallback) : val
    }

    setInputErrors(pattern?: RegExp, assert?: Array<{ test: (value: string) => boolean; msg: () => string }>) {
        if (this.data.unmatched === undefined) return

        const error =
            (pattern !== undefined && this.data.unmatched.match(pattern) === null) ||
            (assert !== undefined && assert.some(a => a.test(this.data.unmatched)))

        if (this.data.error !== error) {
            this.data.error = error
            window.updatePage()
        }
    }
}

export { InputComponent, InputData }
