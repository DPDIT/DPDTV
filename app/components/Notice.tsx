interface NoticeProps {
  currentRoute?: string;
  selectedFolder?: string;
}

export default function Notice({ currentRoute, selectedFolder }: NoticeProps) {
  return (
    <div className="bg-white border-l-4 text-black p-4 mb-4" role="alert">
      {selectedFolder ? (
        <h1 className="text-4xl py-4">No Images Found in {selectedFolder}</h1>
      ) : null}

      {currentRoute == "public" ? (
        <>
          <p className="font-bold">Notice</p>
          <p>
            Public images are openly available on the internet and can be
            accessed by anyone.
          </p>
        </>
      ) : null}
    </div>
  );
}
