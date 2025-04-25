.PHONY: *

pretty:
	npx prettier "!*.min.css" --write .

css:
	npx @tailwindcss/cli -i ./input.css -o ./output.min.css --minify --watch
