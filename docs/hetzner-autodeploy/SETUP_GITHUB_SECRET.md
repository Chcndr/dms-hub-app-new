# Setup GitHub Secret per Auto-Deploy Hetzner

## Il secret HETZNER_SSH_KEY va configurato MANUALMENTE su GitHub

### Passi:

1. Vai su: https://github.com/Chcndr/mihub-backend-rest/settings/secrets/actions
2. Clicca "New repository secret"
3. Nome: `HETZNER_SSH_KEY`
4. Valore: incolla TUTTA la chiave SSH privata qui sotto (comprese le righe BEGIN e END):

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDYmV0JbMCVf7TqpHagOyg/opOnuTLfcJFTYggyUA7TLgAAAJBU74tKVO+L
SgAAAAtzc2gtZWQyNTUxOQAAACDYmV0JbMCVf7TqpHagOyg/opOnuTLfcJFTYggyUA7TLg
AAAEA2XDYJ1in4gla0GwevUqHSp5YyFUF4qB8ErgVga4QsodiZXQlswJV/tOqkdqA7KD+i
k6e5Mt9wkVNiCDJQDtMuAAAADW1hbnVzQHNhbmRib3g=
-----END OPENSSH PRIVATE KEY-----
```

5. Clicca "Add secret"

### Verifica

Dopo aver aggiunto il secret e pushato il workflow, fai un push di test su master.
Vai su https://github.com/Chcndr/mihub-backend-rest/actions per vedere il deploy in corso.
