/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const encryptionKey = $os.getenv("PB_ENCRYPTION_KEY")
    const emailEncrypted = $os.getenv("PB_SUPERUSER_EMAIL")
    const passwordEncrypted = $os.getenv("PB_SUPERUSER_PASSWORD")

    // In local dev these env vars are not set — skip gracefully.
    // The superuser is created manually via the PocketBase admin wizard.
    if (!encryptionKey || !emailEncrypted || !passwordEncrypted) {
        app.logger().warn("create_superuser migration skipped: PB_ENCRYPTION_KEY / PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD not set (local dev mode)")
        return
    }

    const email = $security.decrypt(emailEncrypted, encryptionKey)
    const password = $security.decrypt(passwordEncrypted, encryptionKey)

    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)

    record.set("email", email)
    record.set("password", password)

    app.save(record)
})
