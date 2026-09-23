# asr_server.py (onderaan het bestand)
async def main():
    # Luister ALLEEN lokaal op poort 8082
    port = int(os.environ.get("STT_PORT", "8082"))
    async with websockets.serve(transcribe_handler, "127.0.0.1", port):
        print(f"✅ Interne Python STT server luistert lokaal op ws://127.0.0.1:{port}")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())