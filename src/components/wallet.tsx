import * as React from "react"
import { Button, Icon } from "@mui/material"

function signIn() {
    window.walletAccount.requestSignIn()
}

function signOut() {
    window.walletAccount.signOut()
    window.FORCEUPDATE()
}

export default function WalletComponent() {
    if (window.walletAccount === undefined) return <></>

    return (
        <Button
            className="username-container"
            variant="outlined"
            sx={{
                mr: 5,
                mb: 2,
                px: 2,
                borderRadius: "100px",
                textTransform: "lowercase"
            }}
            onClick={() => {
                window.walletAccount.isSignedIn() ? signOut() : signIn()
            }}
            startIcon={<Icon>account_balance_wallet</Icon>}
        >
            {window.walletAccount.isSignedIn()
                ? `${window.walletAccount.getAccountId()}`
                : `Sign In`}
        </Button>
    )
}
