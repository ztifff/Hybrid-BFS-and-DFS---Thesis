$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open('C:\Users\Fitz\Documents\THESIS\Thesis Progress\Chapter4 RESULTS AND DISCUSSION  draft.docx')
  $text = $doc.Content.Text
  [System.IO.File]::WriteAllText('C:\Users\Fitz\Documents\THESIS\Thesis Progress\System\hybrid-bfs-dfs-performance-evaluation\scratch\chapter4_full_text.txt', $text)
  Write-Output "Saved text of length: $($text.Length)"
  $doc.Close([ref]0)
} finally {
  $word.Quit()
}
