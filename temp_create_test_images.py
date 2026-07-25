from pathlib import Path
import base64

images = {
    'test_image1.png': b'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIUlEQVQoU2NkYGD4z8DAwMDAwMDw/0MAwMDA8P+BggWgABANWXCBsfM0E/AAAAAElFTkSuQmCC',
    'test_image2.png': b'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQoU2NkYGD4z8DAwMDAwMDw/0MAwMDA8P+BhgWgABALckCB/ot9WrAAAAAElFTkSuQmCC',
    'test_image3.png': b'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQoU2NkYGD4z8DAwMDAwMDw/0MAwMDA8P+BgYHgABANsVCBSwK7OQAAAAAASUVORK5CYII=',
}
for name, data in images.items():
    path = Path(name)
    path.write_bytes(base64.b64decode(data))
    print(f'created {path}')
