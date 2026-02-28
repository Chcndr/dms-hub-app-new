# ISTRUZIONI PER CLAUDE CODE (sessione mihub-backend-rest)

## OBIETTIVO

Configura auto-deploy da GitHub a Hetzner per il repo `mihub-backend-rest`.
Ogni push su `master` deve aggiornare automaticamente il server Hetzner.

## COSA DEVI FARE

### STEP 1: Crea il file GitHub Actions workflow

Crea il file `.github/workflows/deploy.yml` con questo contenuto:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches:
      - master
      - main

jobs:
  deploy:
    name: Deploy Backend to Hetzner
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: 157.90.29.66
          username: root
          key: ${{ secrets.HETZNER_SSH_KEY }}
          port: 22
          timeout: 60s
          command_timeout: 3m
          script: |
            echo "Starting deploy..."
            cd /root/mihub-backend-rest

            # Salva lo stato attuale per eventuale rollback
            CURRENT_COMMIT=$(git rev-parse HEAD)
            echo "Current commit: $CURRENT_COMMIT"

            # Pull dal repository
            git fetch origin master
            git reset --hard origin/master
            echo "Updated to: $(git rev-parse HEAD)"

            # Installa dipendenze se package.json è cambiato
            if git diff $CURRENT_COMMIT HEAD --name-only | grep -q "package"; then
              echo "Package changes detected, installing dependencies..."
              npm install --production
            fi

            # Riavvia PM2
            echo "Restarting PM2..."
            pm2 restart mihub-backend --update-env

            # Verifica che sia online
            sleep 3
            pm2 status mihub-backend

            echo "Deploy completed at $(date)"
```

### STEP 2: Commit e push

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add auto-deploy workflow GitHub -> Hetzner via SSH"
git push origin master
```

### STEP 3: Verifica

Dopo il push, verifica che il workflow appaia nella tab Actions del repo su GitHub.

## NOTE IMPORTANTI

- Il workflow usa il secret `HETZNER_SSH_KEY` che l'utente deve configurare su GitHub (Settings > Secrets > Actions)
- Il server Hetzner è `157.90.29.66`, user `root`, path `/root/mihub-backend-rest`
- PM2 process name: `mihub-backend`
- NON creare branch separati, pusha direttamente su master
