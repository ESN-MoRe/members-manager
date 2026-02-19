import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
}

export default function DiffViewer({ oldCode, newCode }: DiffViewerProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 text-sm">
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        styles={{
          variables: {
            light: {
              diffViewerBackground: '#ffffff',
              diffViewerTitleBackground: '#f8f9fa',
              gutterBackground: '#f8f9fa',
              gutterColor: '#adb5bd',
              addedBackground: '#e6ffec',
              addedColor: '#24292e',
              removedBackground: '#ffebe9',
              removedColor: '#24292e',
              wordAddedBackground: '#acf2bd',
              wordRemovedBackground: '#fdb8c0',
            },
          },
          line: {
            padding: '4px 8px',
          },
        }}
      />
    </div>
  );
}
